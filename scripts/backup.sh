#!/bin/bash
# Script para criar backup do banco de dados PostgreSQL

# Criar diretório de backups se não existir
# Criar diretório de backups se não existir
mkdir -p backups

# Nome do arquivo de backup com timestamp
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

# Executar pg_dump no container
docker exec easier-db pg_dump -U easier easier > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup criado com sucesso: $BACKUP_FILE"
    echo "📦 Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Erro ao criar backup"
    exit 1
fi
