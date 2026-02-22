# 🏦 BTG Ledger - Distributed Banking Core

![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Message_Broker-FF6600?logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?logo=kubernetes&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-Database-CC2927?logo=microsoftsqlserver&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)

Um sistema de Ledger bancário (livro-razão) full-stack, construído com foco em **Alta Disponibilidade (HA)**, **Segurança** e **Processamento Assíncrono**. Este projeto simula o núcleo de transações de uma instituição financeira moderna, utilizando arquitetura orientada a eventos para dissociar fluxos críticos (como persistência financeira) de operações secundárias (como notificações de 2FA).

---

## 🏗️ Arquitetura e Padrões de Projeto

O backend foi desenvolvido seguindo **Clean Architecture** e **Domain-Driven Design (DDD)**, garantindo que as regras de negócio bancárias sejam agnósticas a frameworks de infraestrutura.

### Topologia dos Serviços
1. **REST API (Síncrono):** Construída em ASP.NET Core 10. Responsável por gerir a autenticação JWT, validação de payload, persistência no banco e publicação de eventos no RabbitMQ.
2. **Worker Service (Assíncrono):** Microsserviço `.NET BackgroundService`. Atua como *Consumer* das filas do RabbitMQ, processando envios de SMS (MFA/2FA) e consolidando logs de transações sem bloquear a API principal.
3. **Message Broker:** **RabbitMQ**. Garante o padrão *Event-Driven Architecture*, criando um buffer de resiliência para que a API não caia durante picos de acessos.
4. **Relational Database:** **Azure SQL Edge / SQL Server**. Atua como *Single Source of Truth*. As migrações são aplicadas automaticamente no startup (Code-First EF Core).
5. **Frontend:** Single Page Application (SPA) desenvolvida em **React 18**, fornecendo um painel em tempo real para abertura de conta e operações financeiras.

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** C# 13, .NET 10, Entity Framework Core, BCrypt (Hashing de senhas), JWT Bearer Auth.
* **Frontend:** React.js, Vite, Axios.
* **Mensageria:** RabbitMQ (AMQP).
* **Infraestrutura:** Docker, Docker Compose, Kubernetes (K8s).
* **CI/CD:** GitHub Actions.

---

## 🚀 Como Executar o Projeto Localmente

Este sistema foi concebido de forma **Cloud Native**. Você não precisa instalar o SQL Server ou o .NET localmente para rodá-lo, apenas o Docker.

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (com a opção Kubernetes habilitada nas configurações, caso deseje usar o K8s).
* Portas livres na sua máquina: `5088` (API), `5173` (React frontend), `1433` (SQL) e `5672/15672` (RabbitMQ).

---

### Opção 1: Rodando com Docker Compose (Ambiente de Desenvolvimento)
A forma mais rápida de subir toda a stack. O Docker Compose criará uma rede virtual isolada e subirá os 4 containers simultaneamente.

1. Clone o repositório:
```bash
git clone [https://github.com/SEU_USUARIO/NOME_DO_REPO.git](https://github.com/SEU_USUARIO/NOME_DO_REPO.git)
cd NOME_DO_REPO
```

2. Suba a infraestrutura em background:

```Bash
docker-compose up -d --build
```

3. Verificando os Logs do Worker (Importante para o 2FA):
Como o SMS é simulado, o PIN de 6 dígitos para o Login aparecerá nos logs do Worker.

```Bash
docker logs -f btg-ledger-worker-1
```

4. Acesse as aplicações:

* Frontend React: http://localhost:5173 (Navegue até a pasta do frontend, rode npm install e npm run dev).
* Swagger API: http://localhost:5088/swagger
* RabbitMQ Panel: http://localhost:15672 (user: guest, pass: guest)

Para desligar o ambiente: docker-compose down.

### Opção 2: Rodando com Kubernetes (Simulação de Produção)
Esta opção demonstra o escalonamento, auto-healing e balanceamento de carga do K8s, simulando como o sistema rodaria na nuvem (AWS/Azure).

1. Garanta que o Docker Compose está desligado (docker-compose down).

2. Aplique os manifestos de infraestrutura (Banco e Broker):

```Bash
kubectl apply -f k8s/infra-deployment.yaml
```

3. Aplique os manifestos das Aplicações (API e Worker):

```Bash
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
```

4. Verifique se todos os Pods estão rodando de forma saudável:

```Bash
kubectl get pods
```

5. Acesso Externo (Port-Forwarding):
Como a API está dentro do Cluster K8s, precisamos criar um túnel para o seu computador acessá-la:

```Bash
kubectl port-forward svc/btg-ledger-api-service 5088:5088
```
(Deixe este terminal aberto. O Frontend React agora conseguirá se comunicar com o K8s).

6. Lendo os Logs de Mensageria (MFA):
Em outro terminal, escute os logs do Worker para capturar o código do SMS:

```Bash
kubectl logs -f -l app=btg-ledger-worker
```

Para destruir o cluster local: kubectl delete -f k8s/

🔄 Automação e CI/CD
O projeto conta com uma esteira de Integração Contínua (CI) configurada via GitHub Actions (.github/workflows/ci-cd.yml).
A cada Push ou Pull Request na branch main, um robô Linux na nuvem é provisionado para:

1. Fazer o checkout do código.

2. Restaurar dependências e compilar a solução C# inteira (.slnx).

3. Executar validações de Build bloqueando o deploy em caso de quebras.

4. Gerar e validar as Imagens Docker da API e do Worker (Prontas para Continuous Deployment).
