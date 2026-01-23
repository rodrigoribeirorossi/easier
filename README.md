# easier 💰

**Assistente Financeiro Pessoal** - Controle completo de finanças pessoais e familiares com interface moderna e intuitiva.

![easier](https://img.shields.io/badge/Status-Prototipo-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Visão Geral

easier é um assistente financeiro pessoal completo desenvolvido para uso local (servidor pessoal), oferecendo controle total sobre suas finanças sem depender de serviços em nuvem.

### ✨ Funcionalidades Principais

#### 📊 Dashboard
- Visão geral com saldo total, entradas e saídas do mês
- Gráfico de fluxo de caixa mensal
- Resumo de investimentos
- Lista de próximos pagamentos com alertas

#### 💳 Gestão de Transações
- Registro de entradas e saídas
- Categorização inteligente
- Filtros avançados (data, categoria, tipo)
- Suporte a tags personalizadas

#### 🏦 Gestão de Contas
- Contas bancárias
- Cartões de crédito
- Carteiras digitais
- Dinheiro em espécie
- Visualização de saldo por conta

#### 📅 Calendário Financeiro
- Visualização mensal de pagamentos
- Alertas de vencimento
- Status visual (pendente, pago, atrasado)
- Integração com pagamentos recorrentes

#### 💵 Gestão de Pagamentos
- Contas fixas e variáveis
- Recorrência (mensal, semanal, anual)
- Controle de status
- Histórico completo

#### 📈 Simulador de Investimentos
- **Poupança** (6.17% a.a.)
- **CDB 100% CDI** (13.25% a.a.)
- **Tesouro IPCA+** (11.5% a.a.)
- **LCI/LCA** (10.6% a.a.)
- **Ações** (variável)
- Calculadora de juros compostos
- Gráficos de projeção comparativos
- Configuração de aporte mensal

#### 📑 Relatórios
- Gastos por categoria (gráfico de pizza)
- Evolução patrimonial
- Comparativo mensal

#### ⚙️ Configurações
- Perfis de usuário (família)
- Tema claro/escuro
- Notificações personalizadas

## 🛠 Tecnologias

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderna
- **Shadcn/UI** - Design System
- **Tailwind CSS** - Framework CSS
- **Recharts** - Gráficos e visualizações
- **Lucide React** - Ícones
- **React Router DOM** - Navegação
- **date-fns** - Manipulação de datas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma ORM** - ORM moderno
- **PostgreSQL** - Banco de dados relacional (via Docker)
- **SQLite** - Banco de dados local (desenvolvimento)
- **TypeScript** - Tipagem estática

## 📦 Instalação

### Opção 1: Instalação com Docker (Recomendado para Produção)

#### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+

#### Início Rápido

1. **Clone o repositório**
```bash
git clone https://github.com/rodrigoribeirorossi/easier.git
cd easier
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env se necessário
```

3. **Inicie a aplicação com Docker**
```bash
docker-compose up -d
```

4. **Acesse a aplicação**
```
Aplicação: http://localhost:3000
Adminer (gerenciador DB): http://localhost:8080
  - Sistema: PostgreSQL
  - Servidor: db
  - Usuário: easier
  - Senha: easier123
  - Base de dados: easier
```

#### Comandos Docker Úteis

| Comando | Descrição |
|---------|-----------|
| `docker-compose up -d` | Iniciar serviços em background |
| `docker-compose down` | Parar todos os serviços |
| `docker-compose logs -f app` | Ver logs da aplicação em tempo real |
| `docker-compose logs -f db` | Ver logs do banco de dados |
| `docker-compose ps` | Verificar status dos containers |
| `docker-compose restart app` | Reiniciar a aplicação |
| `docker-compose build --no-cache` | Rebuild completo das imagens |
| `./scripts/backup.sh` | Criar backup do banco de dados |
| `./scripts/restore.sh backup.sql` | Restaurar backup |

Ou usando os scripts do package.json:

```bash
npm run docker:up       # Iniciar serviços
npm run docker:down     # Parar serviços
npm run docker:logs     # Ver logs
npm run docker:build    # Rebuild
npm run docker:restart  # Reiniciar
```

#### Acesso na Rede Local

Para acessar a aplicação de outros dispositivos na mesma rede:

1. **Descubra o IP do servidor**

```bash
# Linux/Mac
ip addr show | grep inet
# ou
ifconfig | grep inet

# Windows
ipconfig
```

2. **Acesse de qualquer dispositivo na rede**
```
http://192.168.X.X:3000
```
Substitua `192.168.X.X` pelo IP do seu servidor.

#### Personalização

**Alterar credenciais do banco:**
Edite o arquivo `docker-compose.yml` e `.env`:
```yaml
# docker-compose.yml
environment:
  - POSTGRES_USER=seu_usuario
  - POSTGRES_PASSWORD=sua_senha_segura
  - POSTGRES_DB=seu_banco
```

**Alterar portas:**
```yaml
# docker-compose.yml
ports:
  - "8080:3000"  # Aplicação na porta 8080
  - "5433:5432"  # PostgreSQL na porta 5433
```

**Fazer backup automático:**
Adicione ao crontab (Linux):
```bash
# Backup diário às 2h da manhã
0 2 * * * /caminho/para/easier/scripts/backup.sh
```

### Opção 2: Instalação Local (Desenvolvimento)

#### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/rodrigoribeirorossi/easier.git
cd easier
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
```bash
npm run db:push
npm run db:seed
```

4. **Inicie o servidor backend** (em um terminal)
```bash
npm run server
```

5. **Inicie o frontend** (em outro terminal)
```bash
npm run dev
```

6. **Acesse a aplicação**
```
Frontend: http://localhost:3000
Backend API: http://localhost:3001
```

## 🚀 Scripts Disponíveis

```bash
# Frontend
npm run dev          # Inicia o servidor de desenvolvimento Vite
npm run build        # Compila o projeto para produção
npm run preview      # Preview da build de produção

# Backend
npm run server       # Inicia o servidor Express (com hot-reload)

# Database
npm run db:push      # Sincroniza o schema do Prisma com o banco
npm run db:seed      # Popula o banco com dados de exemplo
npm run db:studio    # Abre o Prisma Studio para gerenciar dados

# Docker
npm run docker:up       # Inicia serviços Docker
npm run docker:down     # Para serviços Docker
npm run docker:logs     # Ver logs dos containers
npm run docker:build    # Rebuild das imagens
npm run docker:restart  # Reinicia os containers
```

## 📊 Estrutura de Dados

### Modelos Principais

- **User** - Usuários/membros da família
- **Account** - Contas (bancárias, cartões, carteiras)
- **Category** - Categorias de transações
- **Transaction** - Transações financeiras
- **Payment** - Pagamentos e contas a pagar
- **Investment** - Investimentos

### Diagrama de Relacionamentos

```
User
 ├── Accounts
 ├── Transactions
 ├── Payments
 └── Investments

Account
 ├── Transactions
 └── Payments

Category
 ├── Transactions
 └── Payments
```

## 🎨 Design e UX

### Paleta de Cores
- **Primária**: Azul (#3b82f6) - Navegação e ações principais
- **Sucesso/Entradas**: Verde (#22c55e) - Receitas e saldos positivos
- **Erro/Saídas**: Vermelho (#ef4444) - Despesas e alertas
- **Alerta**: Amarelo (#f59e0b) - Avisos e vencimentos próximos
- **Investimentos**: Roxo (#8b5cf6) - Gráficos e cards de investimento

### Temas
- **Modo Claro** - Tema padrão para uso diurno
- **Modo Escuro** - Tema confortável para uso noturno

### Responsividade
- **Mobile** - Otimizado para smartphones
- **Tablet** - Layout adaptado para tablets
- **Desktop** - Experiência completa em telas grandes

## 📱 Páginas

1. **Dashboard** (`/`) - Visão geral e resumos
2. **Transações** (`/transactions`) - Gestão de transações
3. **Contas** (`/accounts`) - Gestão de contas
4. **Calendário** (`/calendar`) - Calendário financeiro
5. **Pagamentos** (`/payments`) - Gestão de contas a pagar
6. **Investimentos** (`/investments`) - Simulador de investimentos
7. **Relatórios** (`/reports`) - Análises e gráficos

## 🔒 Segurança

- Banco de dados local (SQLite)
- Sem envio de dados para nuvem
- Ideal para uso em servidor doméstico
- Controle total sobre seus dados

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para reportar bugs ou solicitar features, abra uma [issue](https://github.com/rodrigoribeirorossi/easier/issues).

## 👨‍💻 Autor

Desenvolvido com ❤️ para ajudar no controle financeiro pessoal e familiar.

---

**easier** - Tome controle das suas finanças! 💪💰
