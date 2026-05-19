# IFACI - Supervisao Industrial Web

Projeto academico de supervisao industrial para monitorar uma bancada OPC UA por uma interface web.

Esta versao do repositorio foi enxugada para manter apenas o que entra no fluxo principal de execucao:

- `frontend` em Next.js
- `backend` em Express
- `simulador OPC UA` em Python
- `bridge` em Python para publicar leituras no backend

## O que o projeto faz

O sistema simula uma bancada industrial e mostra os dados em um painel web em tempo real.

As leituras monitoradas sao:

- temperatura
- pressao
- umidade
- status de operacao
- trava de seguranca

## Arquitetura

```text
OPC UA server (Python)
        |
        v
bridge.py
        |
        v
Backend Express
        |
        v
Frontend Next.js
```

## Tecnologias usadas

- `Next.js 16`
- `React 19`
- `Express`
- `Python 3`
- `OPC UA`

## Estrutura do projeto

```text
ifaci/
|-- frontend/my-app/         # painel web
|-- opcua-server/server.py   # simulador OPC UA
|-- opcua-server/bridge.py   # ponte OPC UA -> backend
|-- server.js                # API backend
|-- package.json             # dependencias do backend
|-- README.md
```

## Portas

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8080`
- Health check: `http://127.0.0.1:8080/health`
- Lista de dispositivos: `http://127.0.0.1:8080/devices`
- OPC UA: `opc.tcp://127.0.0.1:4840`

## Pre-requisitos

Instale antes de rodar:

1. `Node.js` 20 ou superior
2. `npm`
3. `Python` 3.10 ou superior
4. pacote Python `opcua`

Instalacao do pacote Python:

```bash
pip install opcua
```

## Passo a passo para rodar

### 1. Clonar o repositorio

```bash
git clone <URL_DO_REPOSITORIO>
cd ifaci
```

### 2. Instalar as dependencias do backend

Na raiz do projeto:

```bash
npm install
```

### 3. Instalar as dependencias do frontend

```bash
cd frontend/my-app
npm install
```

### 4. Iniciar o servidor OPC UA

Terminal 1:

```bash
cd opcua-server
python server.py
```

### 5. Iniciar o backend

Terminal 2, na raiz do projeto:

```bash
npm start
```

### 6. Iniciar a bridge

Terminal 3:

```bash
cd opcua-server
python bridge.py
```

### 7. Iniciar o frontend

Terminal 4:

```bash
cd frontend/my-app
npm run dev
```

Abra no navegador:

```text
http://127.0.0.1:3000
```

## Ordem recomendada

1. `python opcua-server/server.py`
2. `npm start`
3. `python opcua-server/bridge.py`
4. `cd frontend/my-app && npm run dev`

## Como validar

1. Abra `http://127.0.0.1:3000`
2. Confirme se existe pelo menos `1` dispositivo
3. Veja se temperatura, pressao e umidade mudam com o tempo
4. Abra `http://127.0.0.1:8080/health`
5. Abra `http://127.0.0.1:8080/devices`

## Rotas principais do backend

- `GET /health`
- `GET /devices`
- `GET /devices/:deviceId`
- `POST /iot`
- `POST /devices`
- `DELETE /destroy`
- `DELETE /destroy/:deviceId`

## Variaveis de ambiente

### Backend

- `PORT`: porta da API. Padrao `8080`
- `DEVICE_STALE_MS`: timeout para offline. Padrao `10000`
- `ALLOW_DEVICE_RESET`: habilita limpeza. Padrao `false`

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`: URL da API. Padrao `http://127.0.0.1:8080`
- `NEXT_PUBLIC_POLL_INTERVAL_MS`: polling da UI. Padrao `2000`
- `NEXT_PUBLIC_DEVICE_STALE_MS`: timeout visual. Padrao `10000`
- `NEXT_PUBLIC_ALLOW_DEVICE_RESET`: mostra botao de limpeza. Padrao `false`

## Comandos uteis

Backend:

```bash
npm start
```

Frontend:

```bash
cd frontend/my-app
npm run dev
npm run build
npm run lint
```

Python:

```bash
cd opcua-server
python server.py
python bridge.py
```

## Problemas comuns

### Porta 3000 ocupada

O Next.js pode subir em outra porta automaticamente.

### Porta 8080 ocupada

Defina a variavel `PORT` antes de iniciar o backend.

### Frontend sem dados

Verifique se estes tres servicos estao rodando:

1. `python opcua-server/server.py`
2. `npm start`
3. `python opcua-server/bridge.py`

### Backend online, mas sem dispositivos

Isso normalmente significa que a `bridge.py` nao conseguiu publicar leituras.

## Resumo rapido

```bash
# terminal 1
cd opcua-server
python server.py

# terminal 2
npm start

# terminal 3
cd opcua-server
python bridge.py

# terminal 4
cd frontend/my-app
npm run dev
```
