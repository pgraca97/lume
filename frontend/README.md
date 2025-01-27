## Setup ambiente dev

### Backend
1. Clona o repo
2. Cria um `.env` usando o `.env.example` como base
3. Instala dependências: `npm install`
4. Liga o servidor: `npm run dev`

### Frontend
1. Clona o repo
2. Cria um `.env` usando o `.env.example` como base
3. Mete o `EXPO_PUBLIC_API_URL` com o IP da tua máquina
4. Instala dependências: `npm install`
5. Liga a app: `npx expo start`

### Dicas
- Para testar no teu telemóvel:
  - Se estiveres na faculdade, usa o hotspot (a rede deles bloqueia as conexões)
  - Em casa ou noutro sítio, basta usar o IP da tua máquina
  - Atualiza sempre o `EXPO_PUBLIC_API_URL` no `.env` do frontend quando mudares de rede
  - Certifica-te que o backend está a correr antes do frontend

Para saber o teu IP:
- Windows: `ipconfig` no terminal
- Mac/Linux: `ifconfig` no terminal