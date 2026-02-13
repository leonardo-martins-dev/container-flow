"""
Script para tentar extrair comandos SQL CREATE TABLE do backup
"""

import re

def extract_sql_structure(filename):
    """Tenta extrair a estrutura SQL do backup"""
    
    print("=" * 80)
    print("🔍 TENTANDO EXTRAIR ESTRUTURA SQL")
    print("=" * 80)
    
    with open(filename, 'rb') as f:
        content = f.read()
    
    # Tentar múltiplas codificações
    for encoding in ['latin-1', 'utf-8', 'cp1252', 'iso-8859-1']:
        try:
            text = content.decode(encoding, errors='ignore')
            break
        except:
            continue
    
    # Procurar por blocos CREATE TABLE completos
    print("\n📋 PROCURANDO COMANDOS CREATE TABLE...")
    print("-" * 80)
    
    # Padrão mais abrangente para CREATE TABLE
    create_patterns = [
        r'CREATE\s+TABLE\s+\[?dbo\]?\.\[?(\w+)\]?\s*\((.*?)\)',
        r'CREATE\s+TABLE\s+\[?(\w+)\]?\s*\((.*?)\)',
    ]
    
    tables_found = []
    
    for pattern in create_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            table_name = match.group(1)
            table_def = match.group(2) if len(match.groups()) > 1 else ""
            
            if len(table_def) > 10 and len(table_def) < 5000:
                tables_found.append((table_name, table_def))
    
    if tables_found:
        print(f"\n✅ Encontradas {len(tables_found)} definições de tabelas!\n")
        
        for table_name, table_def in tables_found[:5]:  # Primeiras 5
            print(f"\n{'=' * 80}")
            print(f"TABELA: {table_name}")
            print('=' * 80)
            
            # Limpar e formatar definição
            lines = table_def.split('\n')
            for line in lines[:20]:  # Primeiras 20 linhas
                line = line.strip()
                if line and len(line) < 200:
                    print(f"  {line}")
            
            if len(lines) > 20:
                print(f"  ... ({len(lines) - 20} linhas omitidas)")
    else:
        print("\n⚠️  Nenhuma definição CREATE TABLE completa encontrada")
        print("    O backup pode estar compactado ou em formato binário proprietário")
    
    # Tentar encontrar ALTER TABLE (relacionamentos)
    print(f"\n\n{'=' * 80}")
    print("🔗 PROCURANDO RELACIONAMENTOS (ALTER TABLE)")
    print("=" * 80)
    
    alter_pattern = r'ALTER\s+TABLE\s+\[?(\w+)\]?\s+ADD\s+(?:CONSTRAINT\s+\[?(\w+)\]?\s+)?FOREIGN\s+KEY\s*\(\[?(\w+)\]?\)\s*REFERENCES\s+\[?(\w+)\]?\s*\(\[?(\w+)\]?\)'
    
    alters = re.findall(alter_pattern, text, re.IGNORECASE)
    
    if alters:
        print(f"\n✅ Encontrados {len(alters)} relacionamentos!\n")
        for table, constraint, fk_col, ref_table, ref_col in alters[:20]:
            print(f"  {table}.{fk_col} → {ref_table}.{ref_col}")
            if constraint:
                print(f"    (Constraint: {constraint})")
    else:
        print("\n⚠️  Nenhum relacionamento explícito encontrado")
    
    # Procurar por INSERT INTO (dados de exemplo)
    print(f"\n\n{'=' * 80}")
    print("💾 PROCURANDO COMANDOS INSERT (Dados)")
    print("=" * 80)
    
    insert_pattern = r'INSERT\s+INTO\s+\[?(\w+)\]?'
    inserts = re.findall(insert_pattern, text, re.IGNORECASE)
    
    if inserts:
        insert_counter = {}
        for table in inserts:
            insert_counter[table] = insert_counter.get(table, 0) + 1
        
        print(f"\n✅ Encontrados {len(inserts)} comandos INSERT!\n")
        print("Tabelas com mais dados:")
        for table, count in sorted(insert_counter.items(), key=lambda x: x[1], reverse=True)[:15]:
            print(f"  • {table:30s}: {count:4d} registros")
    else:
        print("\n⚠️  Nenhum comando INSERT encontrado")
    
    # Procurar por CREATE INDEX
    print(f"\n\n{'=' * 80}")
    print("📇 PROCURANDO ÍNDICES")
    print("=" * 80)
    
    index_pattern = r'CREATE\s+(?:UNIQUE\s+)?(?:CLUSTERED\s+)?INDEX\s+\[?(\w+)\]?\s+ON\s+\[?(\w+)\]?\s*\(\[?(\w+)\]?\)'
    indexes = re.findall(index_pattern, text, re.IGNORECASE)
    
    if indexes:
        print(f"\n✅ Encontrados {len(indexes)} índices!\n")
        for idx_name, table, column in indexes[:20]:
            print(f"  • {idx_name} em {table}({column})")
    else:
        print("\n⚠️  Nenhum índice explícito encontrado")
    
    # Resumo final
    print(f"\n\n{'=' * 80}")
    print("📊 RESUMO DA EXTRAÇÃO SQL")
    print("=" * 80)
    print(f"""
  ✓ Tabelas com CREATE TABLE: {len(tables_found)}
  ✓ Relacionamentos (FK): {len(alters)}
  ✓ Comandos INSERT: {len(inserts)}
  ✓ Índices: {len(indexes)}
    """)
    
    if len(tables_found) == 0 and len(inserts) == 0:
        print("\n⚠️  ATENÇÃO: Backup parece estar em formato binário compactado")
        print("   Recomendação: Restaurar em SQL Server para análise completa")
        print("   Veja: ALTERNATIVAS_BANCO.md")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    extract_sql_structure("BancoTAM")
