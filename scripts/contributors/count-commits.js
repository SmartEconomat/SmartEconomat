const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script para contar commits y PRs (merges) por contribuidor
 * Genera automáticamente el archivo CONTRIBUTORS.md
 * Compatible con Windows, Linux y macOS
 */

// --- CONFIGURACIÓN ---
const ALLOWED_CONTRIBUTORS = ["Darel", "Alexis", "Sergio", "Maurizio", "Guillermo"];

function isContributorAllowed(name) {
    return ALLOWED_CONTRIBUTORS.includes(name);
}

// Obtener el directorio raíz del repositorio
const REPO_ROOT = execSync('git rev-parse --show-toplevel').toString().trim();
const OUTPUT_FILE = path.join(REPO_ROOT, 'CONTRIBUTORS.md');

// Ruta al archivo .mailmap (si existe)
const SCRIPT_DIR = __dirname;
const MAILMAP_FILE = path.join(SCRIPT_DIR, '.mailmap');
const mailmapExists = fs.existsSync(MAILMAP_FILE);
const mailmapArg = mailmapExists ? `-c mailmap.file="${MAILMAP_FILE}"` : '';

// Obtener fecha actual (local)
const currentDate = new Date().toLocaleString('es-ES', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
});

const commitCounts = {};
const prCounts = {};
const allContributors = [];

console.log("\x1b[34m%s\x1b[0m", "📊 Analizando contribuciones (commits y PRs)...");

// 1. Contar Commits normales (excluyendo merges)
try {
    const shortlogOutput = execSync(`git ${mailmapArg} shortlog -sn --all --no-merges`).toString();
    shortlogOutput.split('\n').forEach(line => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (match) {
            const count = parseInt(match[1], 10);
            const name = match[2].trim();
            
            if (name && name !== "git stash" && isContributorAllowed(name)) {
                commitCounts[name] = count;
                allContributors.push(name);
            }
        }
    });
} catch (error) {
    console.error("Error obteniendo shortlog:", error);
}

// 2. Contar PRs (Ramas fusionadas)
console.log("\x1b[34m%s\x1b[0m", "🔍 Buscando ramas fusionadas...");
try {
    const merges = execSync(`git log --merges --pretty=format:"%P"`).toString();
    merges.split('\n').filter(Boolean).forEach(parents => {
        const parentArray = parents.trim().split(/\s+/);
        
        if (parentArray.length >= 2) {
            const featureTip = parentArray[1];
            
            try {
                const author = execSync(`git ${mailmapArg} show -s --format="%aN" ${featureTip}`).toString().trim();
                
                if (author && author !== "git stash" && isContributorAllowed(author)) {
                    prCounts[author] = (prCounts[author] || 0) + 1;
                }
            } catch (e) {
                // Silenciosamente ignorar errores
            }
        }
    });
} catch (error) {
    console.error("Error obteniendo merges:", error);
}

// 3. Totales y Estadísticas
let totalCommits = 0;
Object.values(commitCounts).forEach(v => totalCommits += v);

let totalPrs = 0;
Object.values(prCounts).forEach(v => totalPrs += v);

if (allContributors.length === 0) {
    console.log("\x1b[34m%s\x1b[0m", "⚠️  No se encontraron contribuidores");
    process.exit(0);
}

// Ordenar por commits (descendente)
const sortedContributors = [...allContributors].sort((a, b) => (commitCounts[b] || 0) - (commitCounts[a] || 0));

const winner = sortedContributors[0];
const winnerCommits = commitCounts[winner] || 0;
const winnerPrs = prCounts[winner] || 0;
const winnerPercentage = totalCommits > 0 ? ((winnerCommits / totalCommits) * 100).toFixed(2) : "0.00";

// --- GENERACIÓN DEL REPORTE ---
let content = `# 🏆 Clasificación de Contribuidores - SmartEconomat\n\n`;
content += `> **Última actualización:** ${currentDate}\n\n`;
content += `---\n\n`;

// Sección del Campeón
content += `## 👑 **CAMPEÓN SUPREMO** 👑\n\n`;
content += `### 🎖️ **${winner}**\n\n`;
content += `Este guerrero del código lidera la carga con:\n`;
content += `- 💻 **${winnerCommits}** Commits\n`;
content += `- 🔀 **${winnerPrs}** PRs Fusionados\n\n`;
content += `Demostrando que:\n`;
content += `- ✨ El teclado es su arma favorita\n`;
content += `- 💪 La productividad es su segundo nombre\n`;
content += `- 🚀 Git commit es su mantra matutino\n\n`;
content += `**Estadísticas de Dominio:**\n`;
content += `- Posee el **${winnerPercentage}%** de todo el código.\n`;
content += `- Ha logrado fusionar **${winnerPrs}** funcionalidades completas.\n\n`;
content += `---\n\n`;

content += `## 📊 Hall de la Fama\n\n`;

// Hall de la fama
sortedContributors.slice(1).forEach(contributor => {
    const cCommits = commitCounts[contributor] || 0;
    const cPrs = prCounts[contributor] || 0;
    const cPercentage = totalCommits > 0 ? ((cCommits / totalCommits) * 100).toFixed(2) : "0.00";
    
    content += `### 🥈 ${contributor}\n`;
    content += `- 💻 Commits: **${cCommits}** (${cPercentage}%)\n`;
    content += `- 🔀 PRs Fusionados: **${cPrs}**\n\n`;
});

content += `---\n\n`;

// Zona de mejora
const lastContributor = sortedContributors[sortedContributors.length - 1];
const lastCommits = commitCounts[lastContributor] || 0;
const lastPrs = prCounts[lastContributor] || 0;

if (sortedContributors.length > 1) {
    content += `## 🐌 **Zona de Mejora Continua** 🐌\n\n`;
    content += `### 😅 **${lastContributor}**\n\n`;
    content += `Con **${lastCommits} commits** y **${lastPrs} PRs**, tenemos aquí a alguien que:\n`;
    content += `- 🤔 Prefiere la calidad sobre la cantidad (eso espero...)\n`;
    content += `- 🏖️ Cree que git es una red social casual\n`;
    content += `- 🎯 Está "esperando el momento perfecto" para contribuir\n\n`;
    content += `**Tu misión (si decides aceptarla):**\n`;
    content += `- [ ] Hacer al menos 1 commit esta semana\n`;
    content += `- [ ] Lograr que te aprueben una rama\n`;
    content += `- [ ] Intentar alcanzar al siguiente en la lista\n\n`;
    content += `---\n\n`;
}

// Tabla Comparativa
content += `## 📈 Tabla Comparativa\n\n`;
content += `| Posición | Contribuidor | Commits | PRs Fusionados | % Código | Estado |\n`;
content += `|----------|--------------|---------|----------------|----------|--------|\n`;

sortedContributors.forEach((contributor, index) => {
    const pos = index + 1;
    const cCommits = commitCounts[contributor] || 0;
    const cPrs = prCounts[contributor] || 0;
    const cPercentage = totalCommits > 0 ? ((cCommits / totalCommits) * 100).toFixed(2) : "0.00";
    
    let status = "💪 Activo";
    if (pos === 1) status = "👑 Líder";
    else if (contributor === lastContributor && sortedContributors.length > 1) status = "🐌 Necesita café";
    
    content += `| #${pos} | ${contributor} | **${cCommits}** | 🔀 **${cPrs}** | ${cPercentage}% | ${status} |\n`;
});

content += `\n---\n\n`;
content += `## 📊 Estadísticas Generales\n\n`;
content += `- **Total de commits:** ${totalCommits}\n`;
content += `- **Total de PRs fusionados:** ${totalPrs}\n`;
content += `- **Total de contribuidores:** ${sortedContributors.length}\n`;
content += `- **Promedio de commits por persona:** ${(totalCommits / sortedContributors.length).toFixed(1)}\n\n`;
content += `---\n\n`;

content += `## 🎯 Ranking de Poder (Commits + PRs)\n\n`;

// Barras de progreso
const maxCommits = winnerCommits || 1;
sortedContributors.forEach(contributor => {
    const cCommits = commitCounts[contributor] || 0;
    const cPrs = prCounts[contributor] || 0;
    const percentage = Math.round((cCommits / maxCommits) * 100);
    
    const barLength = Math.floor(percentage / 5);
    const bar = '█'.repeat(barLength);
    const empty = '░'.repeat(Math.max(0, 20 - barLength));
    
    content += `**${contributor}**\n`;
    content += `\`${bar}${empty}\` ${cCommits} commits | ${cPrs} PRs\n\n`;
});

// Footer
content += `---\n\n`;
content += `## 💡 Notas\n\n`;
content += `- Este archivo se genera automáticamente en cada pre-commit.\n`;
content += `- **Commits:** Total acumulado.\n`;
content += `- **PRs Fusionados:** Ramas que han sido mergeadas al proyecto (crédito al autor original de la rama).\n`;
content += `- ¡Que la competencia sea sana y el código limpio! 🚀\n\n`;
content += `---\n\n`;
content += `*Generado automáticamente por \`count-commits.js\`*\n`;

fs.writeFileSync(OUTPUT_FILE, content);

console.log("\x1b[32m%s\x1b[0m", `✅ CONTRIBUTORS.md actualizado con Commits y PRs`);
console.log("\x1b[34m%s\x1b[0m", `📝 Total Commits: ${totalCommits} | Total PRs: ${totalPrs}`);

// Auto-add if needed
try {
    execSync(`git add "${OUTPUT_FILE}"`);
} catch (e) {}
