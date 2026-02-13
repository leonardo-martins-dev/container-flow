"""
Script de teste de conexão PostgreSQL (Python)

Instalação:
pip install psycopg2-binary

Uso:
python test_connection.py
"""

import psycopg2
from psycopg2.extras import RealDictCursor

# Configuração da conexão
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'container_flow',
    'user': 'postgres',
    'password': 'sua_senha_aqui'  # ALTERE AQUI
}

def test_connection():
    """Testa conexão e queries básicas"""
    
    print('🔍 Testando conexão com PostgreSQL...\n')
    
    try:
        # Conectar ao banco
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print('✅ Conexão estabelecida com sucesso!\n')
        
        # Testar queries
        print('📊 Testando queries...\n')
        
        # 1. Contar registros
        tables = ['containers', 'clientes', 'trabalhadores', 'tipos_processo']
        for table in tables:
            cursor.execute(f'SELECT COUNT(*) as total FROM {table}')
            result = cursor.fetchone()
            print(f'✓ {table.capitalize()}: {result["total"]}')
        
        # 2. Listar containers
        print('\n📦 Containers cadastrados:\n')
        cursor.execute("""
            SELECT 
                c.codigo,
                tc.nome as tipo,
                cl.razao_social as cliente,
                c.status
            FROM containers c
            JOIN tipos_container tc ON c.tipo_container_id = tc.id
            JOIN clientes cl ON c.cliente_id = cl.id
            ORDER BY c.codigo
        """)
        
        containers = cursor.fetchall()
        for container in containers:
            print(f"  • {container['codigo']} - {container['tipo']} - {container['cliente']} - {container['status']}")
        
        # 3. Listar trabalhadores
        print('\n👥 Trabalhadores cadastrados:\n')
        cursor.execute("""
            SELECT 
                codigo,
                nome_completo,
                cargo,
                especializacoes
            FROM trabalhadores
            WHERE ativo = true
            ORDER BY nome_completo
        """)
        
        trabalhadores = cursor.fetchall()
        for trab in trabalhadores:
            specs = ', '.join(trab['especializacoes']) if trab['especializacoes'] else 'Nenhuma'
            print(f"  • {trab['codigo']} - {trab['nome_completo']}")
            print(f"    Cargo: {trab['cargo']}")
            print(f"    Especializações: {specs}\n")
        
        # 4. Listar regras de sequenciamento
        print('🔗 Regras de Sequenciamento:\n')
        cursor.execute("""
            SELECT 
                tp1.nome as origem,
                rs.tipo_regra,
                tp2.nome as destino,
                rs.obrigatorio,
                rs.descricao
            FROM regras_sequenciamento rs
            JOIN tipos_processo tp1 ON rs.tipo_processo_origem_id = tp1.id
            JOIN tipos_processo tp2 ON rs.tipo_processo_destino_id = tp2.id
            WHERE rs.ativo = true
            ORDER BY tp1.nome
        """)
        
        regras = cursor.fetchall()
        for regra in regras:
            obrig = '(Obrigatório)' if regra['obrigatorio'] else '(Opcional)'
            print(f"  • {regra['origem']} → [{regra['tipo_regra']}] → {regra['destino']} {obrig}")
            if regra['descricao']:
                print(f"    {regra['descricao']}")
        
        print('\n✅ Todos os testes passaram!\n')
        print('🎉 Banco de dados está pronto para uso!\n')
        
        # Fechar conexão
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f'❌ Erro ao conectar: {e}\n')
        print('💡 Dicas:')
        print('  1. Verifique se o PostgreSQL está rodando')
        print('  2. Verifique usuário e senha')
        print('  3. Verifique se o banco "container_flow" existe')
        print('  4. Execute: psql -U postgres -d container_flow -f schema.sql\n')
    
    except Exception as e:
        print(f'❌ Erro inesperado: {e}\n')

if __name__ == '__main__':
    test_connection()
