#!/bin/bash

# Script para contar commits y PRs (merges) por contribuidor
# Este script genera automáticamente el archivo CONTRIBUTORS.md

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Analizando contribuciones (commits y PRs)...${NC}"

# Obtener el directorio raíz del repositorio (usando git para ser preciso)
REPO_ROOT=$(git rev-parse --show-toplevel)
OUTPUT_FILE="$REPO_ROOT/CONTRIBUTORS.md"

# Ruta al archivo .mailmap (mismo directorio que el script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
MAILMAP_FILE="$SCRIPT_DIR/.mailmap"

# Obtener fecha actual
CURRENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')

# --- RECOLECCIÓN DE DATOS ---

# 1. Contar Commits normales (excluyendo merges)
# Usamos arrays asociativos (Bash 4+) para mapear Nombre -> Cantidad
declare -A commit_counts
declare -A pr_counts
declare -a all_contributors

# Obtener stats de commits del shortlog
# Formato: "   18  Nombre del Autor"
while read -r line; do
    count=$(echo "$line" | awk '{print $1}')
    name=$(echo "$line" | sed 's/^[[:space:]]*[0-9]*[[:space:]]*//')
    
    if [ -n "$name" ]; then
        commit_counts["$name"]=$count
        # Añadir a la lista de todos los contribuidores si no está (solo para inicializar orden de shortlog como base)
        all_contributors+=("$name")
    fi
done < <(git -c mailmap.file="$MAILMAP_FILE" shortlog -sn --all --no-merges)

# 2. Contar PRs (Ramas fusionadas)
# Estrategia: Buscar commits de merge, tomar el 2do padre (la rama fusionada), y ver su autor.
# Esto identifica "quien hizo la rama" en lugar de "quien la fusionó".

echo -e "${BLUE}🔍 Buscando ramas fusionadas...${NC}"
merges=$(git log --merges --pretty=format:"%P")

while read -r parents; do
    # Convertir string de padres en array
    parent_array=($parents)
    
    # Si hay al menos 2 padres, es un merge real de una rama
    if [ ${#parent_array[@]} -ge 2 ]; then
        feature_tip=${parent_array[1]}
        
        # Obtener el autor del commit de la rama (respetando .mailmap)
        author=$(git -c mailmap.file="$MAILMAP_FILE" show -s --format='%aN' "$feature_tip")
        
        # Limpiar espacios en blanco del nombre (trim)
        author=$(echo "$author" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        if [ -n "$author" ]; then
            # Incrementar contador de PRs
            if [ -z "${pr_counts["$author"]}" ]; then
                pr_counts["$author"]=1
            else
                ((pr_counts["$author"]++))
            fi
        fi
    fi
done <<< "$merges"

# Calcular totales globales
TOTAL_COMMITS=$(git rev-list --all --count --no-merges)
TOTAL_PRS=0
for val in "${pr_counts[@]}"; do
    ((TOTAL_PRS+=val))
done

# Verificar si hay contribuidores
if [ ${#all_contributors[@]} -eq 0 ]; then
    echo -e "${BLUE}⚠️  No se encontraron contribuidores${NC}"
    exit 0
fi

# Ganador (basado en commits por ahora, o podríamos hacer un score combinado)
WINNER="${all_contributors[0]}"
WINNER_COMMITS=${commit_counts["$WINNER"]}
WINNER_PRS=${pr_counts["$WINNER"]:-0}

# --- GENERACIÓN DEL REPORTE ---

cat > "$OUTPUT_FILE" << HEADER
# 🏆 Clasificación de Contribuidores - SmartEconomat

> **Última actualización:** $CURRENT_DATE

---

HEADER

# Sección del Campeón
percentage=$(awk "BEGIN {printf \"%.2f\", ($WINNER_COMMITS/$TOTAL_COMMITS)*100}")

cat >> "$OUTPUT_FILE" << EOF
## 👑 **CAMPEÓN SUPREMO** 👑

### 🎖️ **$WINNER**

Este guerrero del código lidera la carga con:
- 💻 **$WINNER_COMMITS** Commits
- 🔀 **$WINNER_PRS** PRs Fusionados

Demostrando que:
- ✨ El teclado es su arma favorita
- 💪 La productividad es su segundo nombre
- 🚀 Git commit es su mantra matutino

**Estadísticas de Dominio:**
- Posee el **$percentage%** de todo el código.
- Ha logrado fusionar **$WINNER_PRS** funcionalidades completas.

---

## 📊 Hall de la Fama

EOF

# Resto de contribuidores
count=0
for contributor in "${all_contributors[@]}"; do
    # Saltar al ganador
    if [ "$contributor" == "$WINNER" ]; then
        continue
    fi
    
    c_commits=${commit_counts["$contributor"]}
    c_prs=${pr_counts["$contributor"]:-0}
    c_percentage=$(awk "BEGIN {printf \"%.2f\", ($c_commits/$TOTAL_COMMITS)*100}")
    
    cat >> "$OUTPUT_FILE" << EOF
### 🥈 $contributor
- 💻 Commits: **$c_commits** ($c_percentage%)
- 🔀 PRs Fusionados: **$c_prs**

EOF
    ((count++))
done

cat >> "$OUTPUT_FILE" << EOF

---

EOF

# Zona de mejora (último en la lista)
LAST_INDEX=$((${#all_contributors[@]} - 1))
LAST_CONTRIBUTOR="${all_contributors[$LAST_INDEX]}"
LAST_COMMITS=${commit_counts["$LAST_CONTRIBUTOR"]}
LAST_PRS=${pr_counts["$LAST_CONTRIBUTOR"]:-0}

if [ $LAST_INDEX -gt 0 ]; then
    cat >> "$OUTPUT_FILE" << EOF
## 🐌 **Zona de Mejora Continua** 🐌

### 😅 **$LAST_CONTRIBUTOR**

Con **$LAST_COMMITS commits** y **$LAST_PRS PRs**, tenemos aquí a alguien que:
- 🤔 Prefiere la calidad sobre la cantidad (eso espero...)
- 🏖️ Cree que git es una red social casual
- 🎯 Está "esperando el momento perfecto" para contribuir

**Tu misión (si decides aceptarla):**
- [ ] Hacer al menos 1 commit esta semana
- [ ] Lograr que te aprueben una rama
- [ ] Intentar alcanzar al siguiente en la lista

---

EOF
fi

# Tabla Comparativa Completa
cat >> "$OUTPUT_FILE" << EOF
## 📈 Tabla Comparativa

| Posición | Contribuidor | Commits | PRs Fusionados | % Código | Estado |
|----------|--------------|---------|----------------|----------|--------|
EOF

i=1
for contributor in "${all_contributors[@]}"; do
    c_commits=${commit_counts["$contributor"]}
    c_prs=${pr_counts["$contributor"]:-0}
    c_percentage=$(awk "BEGIN {printf \"%.2f\", ($c_commits/$TOTAL_COMMITS)*100}")
    
    if [ $i -eq 1 ]; then
        status="👑 Líder"
    elif [ "$contributor" == "$LAST_CONTRIBUTOR" ] && [ $LAST_INDEX -gt 0 ]; then
        status="🐌 Necesita café"
    else
        status="💪 Activo"
    fi
    
    echo "| #$i | $contributor | **$c_commits** | 🔀 **$c_prs** | $c_percentage% | $status |" >> "$OUTPUT_FILE"
    ((i++))
done

# Estadísticas Generales
cat >> "$OUTPUT_FILE" << EOF

---

## 📊 Estadísticas Generales

- **Total de commits:** $TOTAL_COMMITS
- **Total de PRs fusionados:** $TOTAL_PRS
- **Total de contribuidores:** ${#all_contributors[@]}
- **Promedio de commits por persona:** $(awk "BEGIN {printf \"%.1f\", $TOTAL_COMMITS/${#all_contributors[@]}}")

---

## 🎯 Ranking de Poder (Commits + PRs)

EOF

# Barras de progreso
for contributor in "${all_contributors[@]}"; do
    c_commits=${commit_counts["$contributor"]}
    c_prs=${pr_counts["$contributor"]:-0}
    
    max_commits=${commit_counts["$WINNER"]}
    percentage=$(awk "BEGIN {printf \"%.0f\", ($c_commits/$max_commits)*100}")
    
    bar_length=$((percentage / 5))
    bar=$(printf '█%.0s' $(seq 1 $bar_length))
    empty=$((20 - bar_length))
    if [ $empty -lt 0 ]; then empty=0; fi
    empty_bar=""
    if [ $empty -gt 0 ]; then
        empty_bar=$(printf '░%.0s' $(seq 1 $empty))
    fi
    
    cat >> "$OUTPUT_FILE" << EOF
**$contributor**
\`$bar$empty_bar\` $c_commits commits | $c_prs PRs

EOF
done

# Footer
cat >> "$OUTPUT_FILE" << EOF
---

## 💡 Notas

- Este archivo se genera automáticamente en cada pre-commit.
- **Commits:** Total acumulado.
- **PRs Fusionados:** Ramas que han sido mergeadas al proyecto (crédito al autor original de la rama).
- ¡Que la competencia sea sana y el código limpio! 🚀

---

*Generado automáticamente por \`count-commits.sh\`*
EOF

echo -e "${GREEN}✅ CONTRIBUTORS.md actualizado con Commits y PRs${NC}"
echo -e "${BLUE}📝 Total Commits: $TOTAL_COMMITS | Total PRs: $TOTAL_PRS${NC}"

if [ -n "$HUSKY" ]; then
    git add "$OUTPUT_FILE"
fi
