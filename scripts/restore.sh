#!/bin/bash
# Script para restaurar backup do banco de dados PostgreSQL

if [ -z "$1" ]; then
    echo "❌ Uso: ./restore.sh <arquivo_backup.sql>"
    echo "Exemplo: ./restore.sh backups/backup_20260120_140000.sql"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATENÇÃO: Este processo irá substituir todos os dados atuais do banco!"
echo "📁 Arquivo: $BACKUP_FILE"
read -p "Deseja continuar? (s/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi

# Restaurar backup
docker exec -i easier-db psql -U easier easier < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup restaurado com sucesso!"
else
    echo "❌ Erro ao restaurar backup"
    exit 1
fi
