/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex.schema.createTable('usuarios', table => {
    table.increments('id').primary();
    table.string('nome').notNullable();
    table.string('email').notNullable().unique();
    table.string('senha').notNullable();
  });
  await knex('usuarios').del()
  await knex('usuarios').insert([
    {id: 1, nome: 'vitor', senha: 'v1A@', email: 'vitor@teste.com'},
    {id: 2, nome: 'pedro', senha: 'p2A@', email: 'pedro@teste.com'},
  ]);
};
