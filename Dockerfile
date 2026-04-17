FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && \
    mkdir -p /usr/local/openjdk-21 && \
    wget -qO - https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3+9/OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz | \
    tar -xzC /usr/local/openjdk-21 --strip-components=1 && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/local/openjdk-21
ENV PATH=$JAVA_HOME/bin:$PATH

RUN npm install -g firebase-tools

WORKDIR /app

EXPOSE 4000 5000 5001 8080 9099 9199

CMD ["sh", "-c", "npm --prefix functions install && npm --prefix functions run build && firebase emulators:start --project demo-cortex-cic --import=./emulator-data"]
