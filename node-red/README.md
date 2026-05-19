# Node-RED do projeto

Esta pasta contem um workspace local do Node-RED para a integracao do projeto com OPC UA.

## Instalar

```bash
cd node-red
npm install
```

## Rodar

```bash
npm start
```

Editor do Node-RED:

```text
http://127.0.0.1:1880
```

## O que esse fluxo faz

- le `Temperature`, `Pressure`, `Running`, `Humidity` e `SafetyLock` do OPC UA
- envia cada leitura para `http://127.0.0.1:8080/iot`
- usa o mesmo `deviceId` esperado pelo frontend e backend

## Ordem recomendada

1. `python opcua-server/server.py`
2. `npm start` na raiz do projeto
3. `npm start` dentro de `node-red`
4. `npm run dev` em `frontend/my-app`

## Importante

Use `Node-RED` ou `bridge.py`, nao os dois ao mesmo tempo.
