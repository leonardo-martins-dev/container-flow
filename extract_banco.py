"""
Script melhorado para extrair informações do backup SQL Server
Não requer instalação de bibliotecas externas
"""

import re
import os
from collections import defaultdict

def extract_sql_backup_info(filename):
    """Extrai informações detalhadas de um backup SQL Server"""
    
    print("=" * 80)
    print(f"ANÁLISE DO BANCO DE DADOS: {filename}")
    print("=" * 80)
    
    # Verificar tamanho do arquivo
    file_size = os.path.getsize(filename) / (1024 * 1024)  # MB
    print(f"\n📊 Tamanho do arquivo: {file_size:.2f} MB\n")
    
    with open(filename, 'rb') as f:
        # Ler primeiros bytes
        header = f.read(100)
        
        # Verificar se é backup SQL Server
        if header[:4] == b'TAPE':
            print("✅ Arquivo identificado como backup SQL Server (formato TAPE)\n")
        else:
            print("⚠️  Formato não reconhecido como backup SQL Server padrão\n")
        
        # Ler todo o conteúdo
        f.seek(0)
        content = f.read()
        
        # Tentar decodificar como texto
        try:
            text = content.decode('latin-1', errors='ignore')
        except:
            text = content.decode('utf-8', errors='ignore')
    
    # ========== TABELAS ==========
    print("=" * 80)
    print("📋 TABELAS ENCONTRADAS")
    print("=" * 80)
    
    # Procurar CREATE TABLE com mais contexto
    table_patterns = [
        r'CREATE\s+TABLE\s+\[?dbo\]?\.\[?(\w+)\]?',
        r'CREATE\s+TABLE\s+\[?(\w+)\]?',
        r'TABLE\s+\[?dbo\]?\.\[?(\w+)\]?'
    ]
    
    tables = set()
    for pattern in table_patterns:
        found = re.findall(pattern, text, re.IGNORECASE)
        tables.update(found)
    
    # Filtrar tabelas do sistema
    system_tables = {'sysdiagrams', 'trace', 'dtproperties'}
    tables = sorted([t for t in tables if t.lower() not in system_tables and len(t) > 2])
    
    if tables:
        for i, table in enumerate(tables, 1):
            print(f"  {i:2d}. {table}")
    else:
        print("  ⚠️  Nenhuma tabela encontrada com padrões comuns")
    
    # ========== ESTRUTURA DE TABELAS ==========
    print(f"\n{'=' * 80}")
    print("🔍 ESTRUTURA DETALHADA DAS TABELAS")
    print("=" * 80)
    
    # Tentar encontrar definições de colunas por tabela
    table_columns = defaultdict(list)
    
    # Padrão para colunas: [NomeColuna] [tipo]
    column_pattern = r'\[(\w+)\]\s+\[?(varchar|int|datetime|bit|decimal|nvarchar|float|money|text|char|smallint|bigint|date|time|uniqueidentifier)\]?(?:\((\d+)\))?'
    columns = re.findall(column_pattern, text, re.IGNORECASE)
    
    # Agrupar colunas (primeiras 100 únicas)
    unique_columns = {}
    for col, dtype, size in columns[:100]:
        if col not in unique_columns:
            size_str = f"({size})" if size else ""
            unique_columns[col] = f"{dtype}{size_str}"
    
    if unique_columns:
        print("\nColunas encontradas (amostra):")
        for col, dtype in sorted(unique_columns.items())[:30]:
            print(f"  • {col:30s} {dtype}")
    
    # ========== RELACIONAMENTOS ==========
    print(f"\n{'=' * 80}")
    print("🔗 RELACIONAMENTOS (FOREIGN KEYS)")
    print("=" * 80)
    
    # Procurar por FOREIGN KEY
    fk_pattern = r'FOREIGN\s+KEY\s*\(\[?(\w+)\]?\)\s*REFERENCES\s+\[?(\w+)\]?\s*\(\[?(\w+)\]?\)'
    foreign_keys = re.findall(fk_pattern, text, re.IGNORECASE)
    
    if foreign_keys:
        for fk_col, ref_table, ref_col in set(foreign_keys):
            print(f"  • {fk_col} → {ref_table}.{ref_col}")
    else:
        print("  ℹ️  Nenhum relacionamento explícito encontrado")
    
    # ========== ÍNDICES ==========
    print(f"\n{'=' * 80}")
    print("📇 ÍNDICES")
    print("=" * 80)
    
    index_pattern = r'CREATE\s+(?:UNIQUE\s+)?(?:CLUSTERED\s+)?INDEX\s+\[?(\w+)\]?\s+ON\s+\[?(\w+)\]?'
    indexes = re.findall(index_pattern, text, re.IGNORECASE)
    
    if indexes:
        for idx_name, table_name in set(indexes)[:20]:
            print(f"  • {idx_name} em {table_name}")
    else:
        print("  ℹ️  Nenhum índice explícito encontrado")
    
    # ========== DADOS DE EXEMPLO ==========
    print(f"\n{'=' * 80}")
    print("📝 DADOS DE EXEMPLO ENCONTRADOS")
    print("=" * 80)
    
    # Procurar nomes de pessoas (padrão brasileiro)
    print("\n👤 Nomes de pessoas:")
    names = re.findall(r'[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*', text)
    unique_names = sorted(set([n for n in names if 5 < len(n) < 50]))[:20]
    
    if unique_names:
        for name in unique_names:
            print(f"  • {name}")
    else:
        print("  ℹ️  Nenhum nome encontrado")
    
    # Procurar emails
    print("\n📧 Emails:")
    emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    unique_emails = sorted(set(emails))[:10]
    
    if unique_emails:
        for email in unique_emails:
            print(f"  • {email}")
    else:
        print("  ℹ️  Nenhum email encontrado")
    
    # Procurar telefones brasileiros
    print("\n📱 Telefones:")
    phones = re.findall(r'\(?\d{2}\)?\s?\d{4,5}-?\d{4}', text)
    unique_phones = sorted(set(phones))[:10]
    
    if unique_phones:
        for phone in unique_phones:
            print(f"  • {phone}")
    else:
        print("  ℹ️  Nenhum telefone encontrado")
    
    # ========== PALAVRAS-CHAVE ==========
    print(f"\n{'=' * 80}")
    print("🔑 PALAVRAS-CHAVE DO DOMÍNIO")
    print("=" * 80)
    
    keywords = {
        'container': 'Containers',
        'processo': 'Processos',
        'trabalhador': 'Trabalhadores',
        'funcionario': 'Funcionários',
        'cliente': 'Clientes',
        'pedido': 'Pedidos',
        'ordem': 'Ordens',
        'producao': 'Produção',
        'fabrica': 'Fábrica',
        'servico': 'Serviços',
        'lavagem': 'Lavagem',
        'pintura': 'Pintura',
        'solda': 'Solda',
        'limpeza': 'Limpeza'
    }
    
    print()
    for keyword, label in keywords.items():
        count = len(re.findall(keyword, text, re.IGNORECASE))
        if count > 0:
            print(f"  • {label:20s}: {count:4d} ocorrências")
    
    # ========== RESUMO ==========
    print(f"\n{'=' * 80}")
    print("📊 RESUMO DA ANÁLISE")
    print("=" * 80)
    print(f"""
  ✓ Tabelas identificadas: {len(tables)}
  ✓ Colunas únicas: {len(unique_columns)}
  ✓ Relacionamentos: {len(set(foreign_keys))}
  ✓ Índices: {len(set(indexes))}
  ✓ Nomes encontrados: {len(unique_names)}
  ✓ Emails encontrados: {len(unique_emails)}
    """)
    
    print("=" * 80)
    print("✅ ANÁLISE CONCLUÍDA")
    print("=" * 80)
    print("\n💡 Dica: Para análise completa, considere restaurar o backup em SQL Server Express")
    print("   Veja o arquivo ALTERNATIVAS_BANCO.md para mais opções\n")

if __name__ == "__main__":
    extract_sql_backup_info("BancoTAM")
