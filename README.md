# weather stagisti Web

Frontend React/Vite con Material UI per la dashboard meteo weather stagisti.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Variabili

```bash
VITE_API_URL=http://localhost:8080/api
```

`VITE_API_URL` deve puntare alla root `/api` del backend Express.

## Flusso manuale

1. Avvia il backend su `http://localhost:8080`.
2. Avvia il frontend con `npm run dev`.
3. All'apertura la dashboard mostra Milano come localita predefinita.
4. Cerca una citta con almeno 2 caratteri.
5. Seleziona un risultato omonimo.
6. Verifica forecast, trend, probabilita pioggia e ricerche recenti.

Non e previsto login/logout. Le ricerche recenti vengono salvate nel `localStorage` del browser.

## Build

```bash
npm run build
npm run preview
```
