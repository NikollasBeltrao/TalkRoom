# Usando uma imagem base do Node.js
FROM node:20

# Cria e define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos de configuração
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta para o contêiner
EXPOSE 4242

# Comando para iniciar o aplicativo
CMD [ "npm", "start" ]
