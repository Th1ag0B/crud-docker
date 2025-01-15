const express = require("express");
const { Pool } = require("pg");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const dotenv = require("dotenv");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const swaggerOpcoes = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Produtos",
      version: "1.0.0",
      description: "Uma API simples de produtos",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Servidor de desenvolvimento",
      },
    ],
  },
  apis: ["./server.js"], // Caminho para a documentação da API
};

const swaggerDocs = swaggerJsdoc(swaggerOpcoes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware para limitar as requisições e evitar abusos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limitar cada IP a 100 requisições por janela
  message: "Muitas requisições, tente novamente mais tarde.",
});

app.use(limiter);

/**
 * @swagger
 * components:
 *   schemas:
 *     Produto:
 *       type: object
 *       required:
 *         - descricao
 *         - rating
 *       properties:
 *         id:
 *           type: integer
 *           description: ID gerado automaticamente do Produto
 *           example: 1
 *         descricao:
 *           type: string
 *           description: A descrição do Produto
 *           example: "Produto Exemplo"
 *         rating:
 *           type: integer
 *           description: A avaliação do Produto (1 a 5)
 *           example: 4
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Ponto de verificação da API
 *     responses:
 *       200:
 *         description: A API está a funcionar
 *         content:
 *           application/json:
 *             example: { "mensagem": "A API de Produtos está a funcionar!" }
 */
app.get("/", (req, res) => {
  res.send({ mensagem: "A API de Produtos está a funcionar!" });
});

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Retorna todos os produtos com paginação
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           description: Número da página para paginação (padrão 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           description: Número de itens por página (padrão 10)
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             example: 
 *               [
 *                 { "id": 1, "descricao": "Produto Exemplo 1", "rating": 4 },
 *                 { "id": 2, "descricao": "Produto Exemplo 2", "rating": 5 }
 *               ]
 *       404:
 *         description: Nenhum produto encontrado
 *         content:
 *           application/json:
 *             example: { "erro": "Nenhum produto encontrado" }
 *       500:
 *         description: Erro ao consultar os produtos
 *         content:
 *           application/json:
 *             example: { "erro": "Ocorreu um erro inesperado ao recuperar os produtos", "detalhes": "Erro na conexão com o banco de dados" }
 */
app.get("/produtos", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const offset = (page - 1) * limit;
    const result = await pool.query("SELECT * FROM produto LIMIT $1 OFFSET $2", [limit, offset]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Nenhum produto encontrado" });
    }
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    if (error.code === 'ECONNREFUSED') {
      return res.status(500).json({ erro: "Conexão com o banco de dados recusada" });
    }
    res.status(500).json({ erro: "Ocorreu um erro inesperado ao recuperar os produtos", detalhes: error.message });
  }
});

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Criar um novo produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Produto'
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             example:
 *               { "mensagem": "Produto criado com sucesso", "produto": { "id": 1, "descricao": "Produto Exemplo", "rating": 4 } }
 *       400:
 *         description: Falha na validação de dados
 *         content:
 *           application/json:
 *             example: { "erro": "Falha na validação", "detalhes": [{ "msg": "A descrição é obrigatória", "param": "descricao" }] }
 *       500:
 *         description: Erro ao criar o produto
 *         content:
 *           application/json:
 *             example: { "erro": "Ocorreu um erro ao criar o produto", "detalhes": "Erro no banco de dados" }
 */
app.post(
  "/produtos",
  [
    body("descricao").notEmpty().withMessage("A descrição é obrigatória"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("A avaliação deve estar entre 1 e 5"),
  ],
  async (req, res) => {
    const erros = validationResult(req);
    if (!erros.isEmpty()) {
      return res.status(400).json({ erro: "Falha na validação", detalhes: erros.array() });
    }

    const { descricao, rating } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO produto (descricao, rating) VALUES ($1, $2) RETURNING *",
        [descricao, rating]
      );
      res.status(201).json({ mensagem: "Produto criado com sucesso", produto: result.rows[0] });
    } catch (error) {
      console.error(error);
      if (error.code === '23505') { // Violação de restrição única (e.g., duplicação de entrada)
        return res.status(400).json({ erro: "Produto com esta descrição já existe" });
      }
      res.status(500).json({ erro: "Ocorreu um erro ao criar o produto", detalhes: error.message });
    }
  }
);

/**
 * @swagger
 * /produtos/{id}:
 *   put:
 *     summary: Atualizar um produto pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Produto'
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *         content:
 *           application/json:
 *             example:
 *               { "id": 1, "descricao": "Produto Exemplo Atualizado", "rating": 5 }
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             example: { "erro": "Produto não encontrado" }
 *       400:
 *         description: Dados inválidos ou duplicados
 *         content:
 *           application/json:
 *             example: { "erro": "Dados duplicados do produto" }
 *       500:
 *         description: Erro ao atualizar o produto
 *         content:
 *           application/json:
 *             example: { "erro": "Ocorreu um erro ao atualizar o produto", "detalhes": "Erro de banco de dados" }
 */
app.put("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const { descricao, rating } = req.body;
  try {
    const result = await pool.query(
      "UPDATE produto SET descricao = $1, rating = $2 WHERE id = $3 RETURNING *",
      [descricao, rating, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ erro: "Dados duplicados do produto" });
    }
    res.status(500).json({ erro: "Ocorreu um erro ao atualizar o produto", detalhes: error.message });
  }
});

/**
 * @swagger
 * /produtos/{id}:
 *   delete:
 *     summary: Apagar um produto pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       204:
 *         description: Produto apagado com sucesso
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             example: { "erro": "Produto não encontrado" }
 *       400:
 *         description: Não pode apagar o produto devido a dependências
 *         content:
 *           application/json:
 *             example: { "erro": "Não é possível apagar o produto devido a dependências" }
 *       500:
 *         description: Erro ao apagar o produto
 *         content:
 *           application/json:
 *             example: { "erro": "Ocorreu um erro ao apagar o produto", "detalhes": "Erro de banco de dados" }
 */
app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM produto WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    if (error.code === '23503') { // Violação de chave estrangeira
      return res.status(400).json({ erro: "Não é possível apagar o produto devido a dependências" });
    }
    res.status(500).json({ erro: "Ocorreu um erro ao apagar o produto", detalhes: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: "Ocorreu um erro no servidor", detalhes: err.message });
});

const porta = process.env.PORT || 4000;
app.listen(porta, () => {
  console.log(`Servidor a correr na porta ${porta}`);
});
