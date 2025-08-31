/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('usuarios').del()
  await knex('usuarios').insert([
    {id: 1, nome: 'vitor', senha: 'v1A@', email: 'vitor@teste.com'},
    {id: 2, nome: 'pedro', senha: 'p2A@', email: 'pedro@teste.com'},
  ]);
};
