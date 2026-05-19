# IFACI - Supervisao Industrial Web

Projeto academico para monitorar uma bancada OPC UA por uma interface web.

O caminho recomendado de execucao deste repositorio usa:

- simulador OPC UA em Python
- backend em Express
- Node-RED para ler OPC UA e enviar dados ao backend
- frontend em Next.js

## Visao geral

Fluxo principal:

```text
OPC UA server (Python)
        |
        v
Node-RED
        |
        v
Backend Express
        |
        v
Frontend Next.js
```

O frontend mostra:

- temperatura
- pressao
- umidade
- status de operacao
- trava de seguranca

## Portas

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8080`
- Health check: `http://127.0.0.1:8080/health`
- Dispositivos: `http://127.0.0.1:8080/devices`
- Node-RED: `http://127.0.0.1:1880`
- OPC UA: `opc.tcp://127.0.0.1:4840`

## Estrutura

```text
ifaci/
|-- frontend/my-app/         # painel web
|-- node-red/                # fluxo local do Node-RED
|-- opcua-server/server.py   # simulador OPC UA
|-- opcua-server/bridge.py   # alternativa ao Node-RED
|-- server.js                # backend
|-- package.json
|-- README.md
```

## Pre-requisitos

Instale antes de rodar:

1. `Node.js` 20 ou superior
2. `npm`
3. `Python` 3.10 ou superior
4. pacote Python `opcua`

Instale o pacote Python:

```bash
pip install opcua
```

Se estiver no PowerShell do Windows e `npm` falhar por politica de execucao, use `npm.cmd`.

## Instalacao

### 1. Backend

Na raiz do projeto:

```bash
npm install
```

### 2. Node-RED

Na pasta `node-red`:

```bash
cd node-red
npm install
cd ..
```

### 3. Frontend

Na pasta `frontend/my-app`:

```bash
cd frontend/my-app
npm install
cd ../..
```

## Como rodar

Abra 4 terminais.

### Terminal 1 - OPC UA server

```bash
cd opcua-server
python server.py
```

### Terminal 2 - Backend

Na raiz do projeto:

```bash
npm start
```

### Terminal 3 - Node-RED

```bash
cd node-red
npm start
```

Abra depois:

```text
http://127.0.0.1:1880
```

### Terminal 4 - Frontend

```bash
cd frontend/my-app
npm run dev
```

Abra depois:

```text
http://127.0.0.1:3000
```

## Ordem correta

Suba exatamente nesta ordem:

1. `python opcua-server/server.py`
2. `npm start` na raiz
3. `npm start` em `node-red`
4. `npm run dev` em `frontend/my-app`

## Como validar

Depois de subir tudo:

1. Abra `http://127.0.0.1:8080/health`
2. Confirme que o backend responde com `status: ok`
3. Abra `http://127.0.0.1:8080/devices`
4. Confirme que existe pelo menos 1 dispositivo
5. Abra `http://127.0.0.1:3000`
6. Veja se temperatura, pressao e umidade mudam com o tempo
7. Abra `http://127.0.0.1:1880` e confirme que o fluxo do Node-RED esta ativo

## Importante

- Use `Node-RED` ou `bridge.py`, nunca os dois ao mesmo tempo
- O fluxo do Node-RED ja esta salvo em `node-red/file.json`
- O backend recebe leituras em `POST /iot`
- O frontend consulta os dispositivos em `GET /devices`

## Alternativa sem Node-RED

Se quiser rodar sem Node-RED, use a `bridge.py`.

Ordem:

1. `python opcua-server/server.py`
2. `npm start` na raiz
3. `python opcua-server/bridge.py`
4. `npm run dev` em `frontend/my-app`

Nesse modo, nao rode o Node-RED.

## Problemas comuns

### `npm` nao funciona no PowerShell

Use:

```bash
npm.cmd install
npm.cmd start
npm.cmd run dev
```

### Porta 3000 ocupada

O Next.js pode iniciar em outra porta automaticamente. Veja a porta mostrada no terminal.

### Porta 8080 ocupada

Defina outra porta antes de iniciar o backend:

```bash
set PORT=18080
npm start
```

No PowerShell:

```powershell
$env:PORT="18080"
npm start
```

### Frontend sem dados

Confira se estes 3 servicos estao ativos:

1. `python opcua-server/server.py`
2. `npm start` na raiz
3. `npm start` em `node-red`

### Backend online, mas sem dispositivos

Normalmente isso significa que o Node-RED nao conseguiu ler o OPC UA ou nao conseguiu enviar para o backend.

## Comandos uteis

Backend:

```bash
npm start
```

Node-RED:

```bash
cd node-red
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
