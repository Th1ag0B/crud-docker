const express = require("express");
const { Pool } = require("pg");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Documentação da API de Produtos",
      version: "1.0.0",
      description: "Uma API simples de Produtos",
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

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Produto:
 *       type: object
 *       required:
 *         - brand
 *         - model
 *         - year
 *       properties:
 *         id:
 *           type: integer
 *           description: ID gerado automaticamente do Produto
 *         brand:
 *           type: string
 *           description: A marca do Produto
 *         model:
 *           type: string
 *           description: O modelo do Produto
 *         year:
 *           type: integer
 *           description: O ano de fabrico do Produto
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Ponto de verificação da saúde
 *     responses:
 *       200:
 *         description: A API está a funcionar
 */
app.get("/", (req, res) => {
  res.send("API de Produtos está a funcionar!");
});

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Retorna todos os Produtos
 *     responses:
 *       200:
 *         description: Lista de todos os Produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Produto'
 */
app.get("/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM product");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Criar um novo Produto
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
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 produto:
 *                   $ref: '#/components/schemas/Produto'
 */
app.post("/produtos", async (req, res) => {
  const { brand, model, year } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO product (brand, model, year) VALUES ($1, $2, $3) RETURNING *",
      [brand, model, year]
    );
    res.status(201).json({
      message: "Produto criado com sucesso :)",
      produto: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
 *         description: ID do Produto
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
 *             schema:
 *               $ref: '#/components/schemas/Produto'
 *       404:
 *         description: Produto não encontrado
 */
app.put("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const { brand, model, year } = req.body;
  try {
    const result = await pool.query(
      "UPDATE product SET brand = $1, model = $2, year = $3 WHERE id = $4 RETURNING *",
      [brand, model, year, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
 *         description: ID do Produto
 *     responses:
 *       204:
 *         description: Produto apagado com sucesso
 *       404:
 *         description: Produto não encontrado
 */
app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM product WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Servidor a correr na porta ${port}`);
});
