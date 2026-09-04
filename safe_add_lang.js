const fs = require('fs');
const file = 'src/app/[lang]/old-user/history/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { languages }")) {
    content = content.replace(
        "import { getSkillName } from '@/lib/vipStaffUtils';",
        "import { getSkillName } from '@/lib/vipStaffUtils';\nimport { languages } from '@/app/(intro)/LanguageSelector.lang';"
    );
}

if (!content.includes("const changeLanguage =")) {
    content = content.replace(
        "const router = useRouter();",
        `const router = useRouter();\n    const changeLanguage = (newLang: string) => {\n        if (newLang === lang) return;\n        router.replace(\`/\${newLang}/old-user/history\`);\n    };`
    );
}

const flagsBlock = `\n                    {/* Language Selector */}\n                    <div className="flex gap-1.5 items-center shrink-0 pr-2">\n                        {languages.map((l) => (\n                            <button \n                                key={l.id} \n                                onClick={() => changeLanguage(l.id)} \n                                className={\`w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border flex items-center justify-center transition-all \${lang === l.id ? 'border-white scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100 hover:scale-105'}\`}\n                            >\n                                <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />\n                            </button>\n                        ))}\n                    </div>`;

content = content.split('<h1 className="flex-1 text-center font-bold text-lg text-white pr-10">').join('<h1 className="flex-1 text-center font-bold text-lg text-white mx-2 truncate">');
content = content.split('{dict.history.page_title}\n                    </h1>').join('{dict.history.page_title}\n                    </h1>' + flagsBlock);
content = content.split('{dict.history.page_title}\n                  </h1>').join('{dict.history.page_title}\n                  </h1>' + flagsBlock);
content = content.split('{dict.history.page_title}</h1>').join('{dict.history.page_title}</h1>' + flagsBlock);

fs.writeFileSync(file, content);
