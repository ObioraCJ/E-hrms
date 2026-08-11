FROM node:20-alpine

WORKDIR /app

# Copy only the dependency manifests first, then install - this lets
# Docker cache this layer. As long as package.json/package-lock.json
# don't change, rebuilding the image later (after editing source code)
# skips reinstalling every dependency from scratch, making rebuilds
# much faster.5
COPY package*.json ./
RUN npm ci --omit=dev

# Now copy the rest of the actual source code.
COPY . .

# Uploads (resumes, profile pictures) need somewhere to live inside
# the container - created here so it exists even before any file is
# ever uploaded, and to make the intent explicit.
RUN mkdir -p uploads/resumes uploads/profile-pictures

EXPOSE 5000

CMD ["node", "server.js"]