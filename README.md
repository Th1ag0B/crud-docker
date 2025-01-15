[![Express Logo](https://i.cloudup.com/zfY6lL7eFa-3000x3000.png)](https://expressjs.com/)

**Fast, unopinionated, minimalist web framework for [Node.js](https://nodejs.org).**

# API de Produtos - Express com PostgreSQL

Esta é uma API RESTful simples para gerenciar produtos, utilizando o framework **Express.js** e o banco de dados **PostgreSQL**. A API permite realizar operações CRUD (Criar, Ler, Atualizar, Apagar) em produtos, com funcionalidades como paginação e validação de dados.

A API está configurada para ser executada com **Docker** e **Docker Compose** para facilitar o ambiente de desenvolvimento e produção.

---

## Tecnologias Utilizadas

- **Node.js** e **Express.js** para a API.
- **PostgreSQL** para o banco de dados.
- **Docker** e **Docker Compose** para containerização e orquestração.
- **Swagger** para documentação da API.
- **Helmet** para segurança.
- **express-rate-limit** para limitar a quantidade de requisições.
- **morgan** para log de requisições HTTP.

---

## Funcionalidades da API

- **GET /produtos**: Retorna todos os produtos com paginação.
- **POST /produtos**: Cria um novo produto.
- **PUT /produtos/{id}**: Atualiza um produto existente.
- **DELETE /produtos/{id}**: Deleta um produto pelo ID.

---

## Pré-requisitos

- **Docker** e **Docker Compose** instalados na sua máquina.

---

## Instalação e Execução

### 1. Clonar o Repositório

Primeiro, clone este repositório em sua máquina:

```bash
git clone https://github.com/seu-usuario/nome-do-repositorio.git
cd nome-do-repositorio
```

### 2. Configurar as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=seu_banco_de_dados
```

Substitua os valores de `seu_usuario`, `sua_senha`, e `seu_banco_de_dados` conforme necessário.

### 3. Subir os Contêineres com Docker Compose

Com o arquivo `.env` configurado, execute o seguinte comando para subir os contêineres:

```bash
docker-compose up -d
```

Isso irá construir e rodar dois contêineres:

1. O contêiner `db` com o PostgreSQL.
2. O contêiner `app` com o seu aplicativo Express.

### 4. Acessar a API

Depois de rodar os contêineres, a API estará acessível no seguinte endereço:

```
http://localhost:4000
```

A documentação da API está disponível em:

```
http://localhost:4000/docs
```

---

## Endpoints da API

### 1. **GET /produtos**

Retorna uma lista de produtos com paginação.

- **Parâmetros de Query**:
  - `page`: Número da página (padrão: 1)
  - `limit`: Número de itens por página (padrão: 10)

**Exemplo de Requisição**:

```bash
GET http://localhost:4000/produtos?page=1&limit=10
```

**Resposta**:

```json
[
  {
    "id": 1,
    "descricao": "Produto Exemplo",
    "rating": 4
  },
  {
    "id": 2,
    "descricao": "Outro Produto",
    "rating": 5
  }
]
```

### 2. **POST /produtos**

Cria um novo produto.

**Corpo da Requisição**:

```json
{
  "descricao": "Novo Produto",
  "rating": 4
}
```

**Resposta**:

```json
{
  "mensagem": "Produto criado com sucesso",
  "produto": {
    "id": 1,
    "descricao": "Novo Produto",
    "rating": 4
  }
}
```

### 3. **PUT /produtos/{id}**

Atualiza um produto pelo ID.

**Corpo da Requisição**:

```json
{
  "descricao": "Produto Atualizado",
  "rating": 5
}
```

**Resposta**:

```json
{
  "id": 1,
  "descricao": "Produto Atualizado",
  "rating": 5
}
```

### 4. **DELETE /produtos/{id}**

Deleta um produto pelo ID.

**Resposta**:

```json
{
  "mensagem": "Produto apagado com sucesso"
}
```

---

## Erros Comuns

### 400 - Bad Request

A requisição contém dados inválidos.

**Exemplo de resposta**:

```json
{
  "erro": "Falha na validação",
  "detalhes": [
    {
      "msg": "A descrição é obrigatória",
      "param": "descricao",
      "location": "body"
    }
  ]
}
```

### 404 - Not Found

Produto não encontrado.

**Exemplo de resposta**:

```json
{
  "erro": "Produto não encontrado"
}
```

### 500 - Internal Server Error

Erro interno no servidor.

**Exemplo de resposta**:

```json
{
  "erro": "Ocorreu um erro no servidor",
  "detalhes": "Mensagem do erro"
}
```

---

## Segurança

A API utiliza o **Helmet** para proteger o aplicativo de vulnerabilidades conhecidas e **express-rate-limit** para limitar o número de requisições feitas a partir de um único IP.

---

## Docker

### Comandos Docker

- **Subir contêineres**:  
  `docker-compose up -d`

- **Parar contêineres**:  
  `docker-compose down`

- **Ver logs do contêiner**:  
  `docker-compose logs -f app`

---

## Contribuição

Se você quiser contribuir para este projeto, sinta-se à vontade para abrir issues ou pull requests. Toda ajuda é bem-vinda!

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
