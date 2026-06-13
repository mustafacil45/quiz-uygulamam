FROM node:18-alpine
WORKDIR /app
COPY package.json /app/
RUN npm ci || true
CMD ["sh", "-c", "echo 'Frontend placeholder container (run Expo locally for development)' && sleep infinity"]
