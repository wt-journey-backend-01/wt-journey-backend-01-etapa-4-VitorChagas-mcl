const casosRepository = require("../repositories/casosRepository");
const agentesRepository = require("../repositories/agentesRepository");

module.exports = {
  async findAll(req, res) {
    const { titulo, descricao, status, agente_id } = req.query;
    let casos = await casosRepository.findAll();

    if (status) {
      casos = casos.filter((caso) => caso.status === status);
    }
    if (agente_id) {
      const agenteIdNum = Number(agente_id);
      casos = casos.filter((caso) => caso.agente_id === agenteIdNum);
    }

    if (titulo) {
      casos = casos.filter((caso) => caso.titulo === titulo);
    }

    if (descricao) {
      casos = casos.filter((caso) => caso.descricao === descricao);
    }

    res.json(casos);
  },

  async findById(req, res) {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ mensagem: "ID inválido" });
    }
    const caso = await casosRepository.findById(id);
    if (!caso) {
      return res.status(404).json({ mensagem: "Caso não encontrado" });
    }
    res.json(caso);
  },

  async create(req, res) {
    const novoCaso = req.body;
    const statusPermitidos = ["aberto", "solucionado"];
    const errors = [];

    if (!novoCaso.titulo) {
      errors.push({ field: "titulo", mensagem: "Título é obrigatório" });
    }

    if (!novoCaso.descricao) {
      errors.push({ field: "descricao", mensagem: "Descrição é obrigatória" });
    }

    if (!novoCaso.status) {
      errors.push({ field: "status", mensagem: "Status é obrigatório" });
    } else if (!statusPermitidos.includes(novoCaso.status)) {
      return res.status(400).json({
        errors: [
          {
            field: "status",
            mensagem: "Status deve ser 'aberto' ou 'solucionado'",
          },
        ],
      });
    }

    if (!novoCaso.agente_id) {
      errors.push({ field: "agente_id", mensagem: "Agente é obrigatório" });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: 400,
        mensagem: "Parâmetros inválidos",
        errors,
      });
    }

    const agenteExiste = await agentesRepository.findById(novoCaso.agente_id);
    if (!agenteExiste) {
      return res
        .status(404)
        .json({ mensagem: "Agente não encontrado para o agente_id informado" });
    }

    const casoCriado = await casosRepository.create(novoCaso);
    return res.status(201).json(casoCriado);
  },

  async update(req, res) {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ mensagem: "ID inválido" });
    }
    const dadosAtualizados = { ...req.body };
    if ("id" in req.body) {
      return res.status(400).json({
        status: 400,
        mensagem: "Não é permitido alterar o ID do caso.",
      });
    }

    const errors = [];

    if (!dadosAtualizados.titulo) {
      errors.push({ field: "titulo", mensagem: "Título é obrigatório" });
    }

    if (!dadosAtualizados.descricao) {
      errors.push({ field: "descricao", mensagem: "Descrição é obrigatória" });
    }

    if (!dadosAtualizados.status) {
      errors.push({ field: "status", mensagem: "Status é obrigatório" });
    } else if (!["aberto", "solucionado"].includes(dadosAtualizados.status)) {
      errors.push({
        field: "status",
        mensagem: "Status deve ser 'aberto' ou 'solucionado'",
      });
    }

    if (!dadosAtualizados.agente_id) {
      errors.push({ field: "agente_id", mensagem: "Agente é obrigatório" });
    } else {
      const agenteExiste = await agentesRepository.findById(
        dadosAtualizados.agente_id
      );
      if (!agenteExiste) {
        return res
          .status(404)
          .json({
            mensagem: "Agente não encontrado para o agente_id informado",
          });
      }
    }

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ status: 400, mensagem: "Parâmetros inválidos", errors });
    }

    const caso = await casosRepository.update(id, dadosAtualizados);
    if (!caso) return res.status(404).json({ mensagem: "Caso não encontrado" });

    res.json(caso);
  },

  async partialUpdate(req, res) {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ mensagem: "ID inválido" });
    }
    const dadosAtualizados = { ...req.body };

    if (Object.keys(dadosAtualizados).length === 0) {
      return res.status(400).json({
        status: 400,
        mensagem: "Nenhum dado para atualizar foi fornecido.",
      });
    }

    if ("id" in dadosAtualizados) {
      return res.status(400).json({
        status: 400,
        mensagem: "Não é permitido alterar o ID do caso.",
      });
    }

    const errors = [];
    const statusPermitidos = ["aberto", "solucionado"];

    if ("titulo" in dadosAtualizados) {
      if (
        typeof dadosAtualizados.titulo !== "string" ||
        dadosAtualizados.titulo.trim() === ""
      ) {
        errors.push({
          field: "titulo",
          mensagem: "Título deve ser uma string não vazia",
        });
      }
    }

    if ("descricao" in dadosAtualizados) {
      if (
        typeof dadosAtualizados.descricao !== "string" ||
        dadosAtualizados.descricao.trim() === ""
      ) {
        errors.push({
          field: "descricao",
          mensagem: "Descrição deve ser uma string não vazia",
        });
      }
    }

    if ("status" in dadosAtualizados) {
      if (!statusPermitidos.includes(dadosAtualizados.status)) {
        errors.push({
          field: "status",
          mensagem: "Status deve ser 'aberto' ou 'solucionado'",
        });
      }
    }

    if ("agente_id" in dadosAtualizados) {
      if (
        typeof dadosAtualizados.agente_id !== "number" &&
        typeof dadosAtualizados.agente_id !== "string"
      ) {
        errors.push({
          field: "agente_id",
          mensagem: "Agente_id deve ser um identificador válido",
        });
      } else {
        const agenteExiste = await agentesRepository.findById(
          dadosAtualizados.agente_id
        );
        if (!agenteExiste) {
          return res
            .status(404)
            .json({
              mensagem: "Agente não encontrado para o agente_id informado",
            });
        }
      }
    }

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ status: 400, mensagem: "Parâmetros inválidos", errors });
    }

    const casoAtualizado = await casosRepository.update(id, dadosAtualizados);

    if (!casoAtualizado) {
      return res.status(404).json({ mensagem: "Caso não encontrado" });
    }

    res.json(casoAtualizado);
  },

  async deleteById(req, res) {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ mensagem: "ID inválido" });
    }
    const deletado = await casosRepository.deleteById(id);
    if (!deletado) {
      return res.status(404).json({ mensagem: "Caso não encontrado" });
    }
    res.status(204).send();
  },
};
