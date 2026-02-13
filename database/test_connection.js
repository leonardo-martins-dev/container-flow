/**
 * Script de teste de conexão PostgreSQL
 * 
 * Instalação:
 * npm install pg
 * 
 * Uso:
 * node test_connection.js
 */

const { Pool } = require('pg');

// Configuração da conexão
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'container_flow',
  user: 'postgres',
  password: 'sua_senha_aqui', // ALTERE AQUI
});

async function testConnection() {
  console.log('🔍 Testando conexão com PostgreSQL...\n');
  
  try {
    // Testar conexão
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Testar query simples
    console.log('📊 Testando queries...\n');
    
    // 1. Contar containers
    const containersResult = await client.query('SELECT COUNT(*) as total FROM containers');
    console.log(`✓ Containers: ${containersResult.rows[0].total}`);
    
    // 2. Contar clientes
    const clientesResult = await client.query('SELECT COUNT(*) as total FROM clientes');
    console.log(`✓ Clientes: ${clientesResult.rows[0].total}`);
    
    // 3. Contar trabalhadores
    const trabalhadoresResult = await client.query('SELECT COUNT(*) as total FROM trabalhadores');
    console.log(`✓ Trabalhadores: ${trabalhadoresResult.rows[0].total}`);
    
    // 4. Contar tipos de processo
    const processosResult = await client.query('SELECT COUNT(*) as total FROM tipos_processo');
    console.log(`✓ Tipos de Processo: ${processosResult.rows[0].total}`);
    
    // 5. Listar containers
    console.log('\n📦 Containers cadastrados:\n');
    const containersListResult = await client.query(`
      SELECT 
        c.codigo,
        tc.nome as tipo,
        cl.razao_social as cliente,
        c.status
      FROM containers c
      JOIN tipos_container tc ON c.tipo_container_id = tc.id
      JOIN clientes cl ON c.cliente_id = cl.id
      ORDER BY c.codigo
    `);
    
    containersListResult.rows.forEach(row => {
      console.log(`  • ${row.codigo} - ${row.tipo} - ${row.cliente} - ${row.status}`);
    });
    
    // 6. Listar regras de sequenciamento
    console.log('\n🔗 Regras de Sequenciamento:\n');
    const regrasResult = await client.query(`
      SELECT 
        tp1.nome as origem,
        rs.tipo_regra,
        tp2.nome as destino,
        rs.descricao
      FROM regras_sequenciamento rs
      JOIN tipos_processo tp1 ON rs.tipo_processo_origem_id = tp1.id
      JOIN tipos_processo tp2 ON rs.tipo_processo_destino_id = tp2.id
      WHERE rs.ativo = true
      ORDER BY tp1.nome
    `);
    
    regrasResult.rows.forEach(row => {
      console.log(`  • ${row.origem} → [${row.tipo_regra}] → ${row.destino}`);
      if (row.descricao) {
        console.log(`    ${row.descricao}`);
      }
    });
    
    console.log('\n✅ Todos os testes passaram!\n');
    console.log('🎉 Banco de dados está pronto para uso!\n');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.error('\n💡 Dicas:');
    console.error('  1. Verifique se o PostgreSQL está rodando');
    console.error('  2. Verifique usuário e senha');
    console.error('  3. Verifique se o banco "container_flow" existe');
    console.error('  4. Execute: psql -U postgres -d container_flow -f schema.sql\n');
  } finally {
    await pool.end();
  }
}

// Executar teste
testConnection();
