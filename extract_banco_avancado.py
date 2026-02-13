"""
Script avançado para extrair strings legíveis do backup SQL Server
Usa técnicas de análise de strings para encontrar padrões de dados
"""

import re
from collections import Counter

def extract_readable_strings(filename, min_length=4):
    """Extrai todas as strings legíveis do arquivo binário"""
    
    print("=" * 80)
    print("🔍 EXTRAÇÃO AVANÇADA DE STRINGS DO BANCO")
    print("=" * 80)
    
    with open(filename, 'rb') as f:
        content = f.read()
    
    # Decodificar como latin-1 (mais permissivo)
    try:
        text = content.decode('latin-1', errors='ignore')
    except:
        text = content.decode('utf-8', errors='ignore')
    
    # ========== PROCURAR NOMES DE TABELAS ==========
    print("\n📋 POSSÍVEIS NOMES DE TABELAS:")
    print("-" * 80)
    
    # Padrões comuns de nomes de tabelas
    table_keywords = [
        'container', 'cliente', 'pedido', 'ordem', 'servico', 'processo',
        'trabalhador', 'funcionario', 'usuario', 'produto', 'item',
        'pagamento', 'fatura', 'nota', 'endereco', 'telefone', 'email',
        'categoria', 'tipo', 'status', 'historico', 'log', 'auditoria'
    ]
    
    # Procurar palavras que parecem nomes de tabelas (CamelCase ou com prefixo tb_)
    possible_tables = set()
    
    # Padrão 1: tb_NomeTabela ou tbl_NomeTabela
    pattern1 = re.findall(r'tb[l]?_(\w+)', text, re.IGNORECASE)
    possible_tables.update(pattern1)
    
    # Padrão 2: Palavras-chave seguidas de 's' (plural)
    for keyword in table_keywords:
        pattern = re.findall(rf'{keyword}[s]?\b', text, re.IGNORECASE)
        if pattern:
            possible_tables.add(keyword)
    
    # Padrão 3: Palavras em CamelCase
    camel_case = re.findall(r'\b[A-Z][a-z]+[A-Z][a-z]+\w*\b', text)
    possible_tables.update([t for t in camel_case if len(t) < 30])
    
    if possible_tables:
        for table in sorted(possible_tables)[:30]:
            print(f"  • {table}")
    else:
        print("  ⚠️  Nenhuma tabela identificada")
    
    # ========== PROCURAR NOMES DE COLUNAS ==========
    print("\n📊 POSSÍVEIS NOMES DE COLUNAS:")
    print("-" * 80)
    
    # Padrões comuns de colunas
    column_patterns = [
        r'\b(id|codigo|nome|descricao|data|valor|quantidade|status|tipo)\b',
        r'\b(cliente_id|container_id|pedido_id|ordem_id|servico_id)\b',
        r'\b(data_\w+|dt_\w+)\b',
        r'\b(vl_\w+|valor_\w+)\b',
        r'\b(qtd_\w+|quantidade_\w+)\b',
        r'\b(nm_\w+|nome_\w+)\b',
        r'\b(ds_\w+|descricao_\w+)\b'
    ]
    
    possible_columns = set()
    for pattern in column_patterns:
        found = re.findall(pattern, text, re.IGNORECASE)
        possible_columns.update(found)
    
    # Filtrar colunas muito comuns
    column_counter = Counter()
    for col in possible_columns:
        count = len(re.findall(rf'\b{re.escape(col)}\b', text, re.IGNORECASE))
        if count > 5:  # Aparece mais de 5 vezes
            column_counter[col] = count
    
    if column_counter:
        for col, count in column_counter.most_common(30):
            print(f"  • {col:30s} ({count} ocorrências)")
    else:
        print("  ⚠️  Nenhuma coluna identificada")
    
    # ========== PROCURAR VALORES DE STATUS ==========
    print("\n🏷️  POSSÍVEIS VALORES DE STATUS/TIPO:")
    print("-" * 80)
    
    status_keywords = [
        'ativo', 'inativo', 'pendente', 'concluido', 'cancelado',
        'em_andamento', 'aguardando', 'finalizado', 'aprovado', 'reprovado',
        'aberto', 'fechado', 'pago', 'a_pagar', 'vencido'
    ]
    
    found_status = {}
    for status in status_keywords:
        count = len(re.findall(rf'\b{status}\b', text, re.IGNORECASE))
        if count > 0:
            found_status[status] = count
    
    if found_status:
        for status, count in sorted(found_status.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {status:20s}: {count} ocorrências")
    else:
        print("  ℹ️  Nenhum status comum encontrado")
    
    # ========== PROCURAR TIPOS DE CONTAINER ==========
    print("\n📦 TIPOS DE CONTAINER/SERVIÇO:")
    print("-" * 80)
    
    container_types = [
        '20', '40', 'dry', 'reefer', 'open', 'flat', 'tank',
        'lavagem', 'pintura', 'solda', 'limpeza', 'reparo', 'manutencao'
    ]
    
    found_types = {}
    for ctype in container_types:
        # Procurar com contexto
        pattern = rf'\b{ctype}\b'
        count = len(re.findall(pattern, text, re.IGNORECASE))
        if count > 5:
            found_types[ctype] = count
    
    if found_types:
        for ctype, count in sorted(found_types.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {ctype:20s}: {count} ocorrências")
    else:
        print("  ℹ️  Nenhum tipo específico encontrado")
    
    # ========== EXTRAIR DADOS ESTRUTURADOS ==========
    print("\n💾 DADOS ESTRUTURADOS ENCONTRADOS:")
    print("-" * 80)
    
    # Procurar por IDs (números que aparecem frequentemente)
    ids = re.findall(r'\b\d{4,8}\b', text)
    id_counter = Counter(ids)
    
    print(f"\n  IDs mais frequentes (possíveis chaves primárias):")
    for id_val, count in id_counter.most_common(10):
        if count > 3:
            print(f"    • ID {id_val}: {count} ocorrências")
    
    # Procurar datas
    dates = re.findall(r'\b\d{2}/\d{2}/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b', text)
    if dates:
        print(f"\n  Datas encontradas (amostra):")
        for date in sorted(set(dates))[:10]:
            print(f"    • {date}")
    
    # Procurar valores monetários
    money = re.findall(r'R\$\s*\d+[.,]\d{2}|\d+[.,]\d{2}', text)
    if money:
        print(f"\n  Valores monetários (amostra):")
        for value in sorted(set(money))[:10]:
            print(f"    • {value}")
    
    # ========== ANÁLISE DE RELACIONAMENTOS ==========
    print("\n🔗 POSSÍVEIS RELACIONAMENTOS:")
    print("-" * 80)
    
    # Procurar padrões de FK (coluna_id)
    fk_pattern = r'\b(\w+)_id\b'
    foreign_keys = set(re.findall(fk_pattern, text, re.IGNORECASE))
    
    if foreign_keys:
        print("\n  Colunas que parecem Foreign Keys:")
        for fk in sorted(foreign_keys)[:20]:
            print(f"    • {fk}_id")
    else:
        print("  ℹ️  Nenhum padrão de FK identificado")
    
    # ========== RESUMO FINAL ==========
    print("\n" + "=" * 80)
    print("📊 RESUMO DA EXTRAÇÃO")
    print("=" * 80)
    print(f"""
  ✓ Possíveis tabelas: {len(possible_tables)}
  ✓ Possíveis colunas: {len(column_counter)}
  ✓ Status/Tipos: {len(found_status)}
  ✓ IDs únicos: {len(id_counter)}
  ✓ Datas encontradas: {len(set(dates))}
  ✓ Foreign Keys: {len(foreign_keys)}
    """)
    
    print("=" * 80)
    print("✅ EXTRAÇÃO CONCLUÍDA")
    print("=" * 80)
    print("\n💡 Para análise completa da estrutura, recomendo:")
    print("   1. Instalar SQL Server Express (gratuito)")
    print("   2. Restaurar o backup BancoTAM")
    print("   3. Usar Azure Data Studio para explorar\n")

if __name__ == "__main__":
    extract_readable_strings("BancoTAM")
