/* Site-owned translations. Original publication metadata, names, formulae and CSV keys stay unchanged. */
(function (root) {
  "use strict";
  const rows = [
    ["Weiwei Zuo | Perovskite Photovoltaic", "Weiwei Zuo | Perowskit-Photovoltaik", "左巍巍（Weiwei Zuo）| 钙钛矿光伏"],
    ["Weiwei Zuo, Dr.-Ing., postdoctoral researcher at the Institute for Photovoltaics, University of Stuttgart. Research on perovskite crystallization, functional interfaces, and device stability.", "Weiwei Zuo, Dr.-Ing., Postdoc am Institut für Photovoltaik der Universität Stuttgart. Forschung zur Kristallisation von Perowskiten, zu funktionalen Grenzflächen und zur Stabilität von Solarzellen.", "左巍巍（Weiwei Zuo）博士，斯图加特大学光伏研究所博士后研究员。研究方向为钙钛矿结晶、功能界面和器件稳定性。"],
    ["Weiwei Zuo", "Weiwei Zuo", "左巍巍"],
    ["WEIWEI ZUO", "WEIWEI ZUO", "左巍巍"],
    ["Weiwei Zuo ·", "Weiwei Zuo ·", "左巍巍 ·"],
    ["Dr.-Ing.", "Dr.-Ing.", "博士"],
    ["Crystallization, interfaces, and resilient solar cells. Research and publications from the University of Stuttgart.", "Kristallisation, Grenzflächen und robuste Solarzellen. Forschung und Publikationen der Universität Stuttgart.", "结晶、界面与稳定的太阳能电池。来自斯图加特大学的研究与论文。"],
    ["Skip to content", "Zum Inhalt springen", "跳转到正文"],
    ["PEROVSKITE PHOTOVOLTAICS", "PEROWSKIT-PHOTOVOLTAIK", "钙钛矿光伏"],
    ["MATERIALS · INTERFACES · STABILITY", "MATERIALIEN · GRENZFLÄCHEN · STABILITÄT", "材料 · 界面 · 稳定性"],
    ["UNIVERSITY OF STUTTGART", "UNIVERSITÄT STUTTGART", "斯图加特大学"],
    ["RESEARCH & PUBLICATIONS", "FORSCHUNG & PUBLIKATIONEN", "研究与论文"],
    ["About", "Über mich", "关于"], ["Research", "Forschung", "研究"], ["Tools", "Werkzeuge", "工具"],
    ["Publications", "Publikationen", "论文"], ["Updates", "Aktuelles", "动态"], ["Contact", "Kontakt", "联系"],
    ["RESEARCH IN PEROVSKITE PHOTOVOLTAICS", "FORSCHUNG ZUR PEROWSKIT-PHOTOVOLTAIK", "钙钛矿光伏研究"],
    ["Postdoctoral Researcher", "Postdoc", "博士后研究员"],
    ["University of Stuttgart", "Universität Stuttgart", "斯图加特大学"],
    ["Crystallization, interfaces,", "Kristallisation, Grenzflächen", "结晶、界面，"],
    ["and", "und", "以及"], ["resilient solar cells.", "robuste Solarzellen.", "稳定的太阳能电池。"],
    ["I study how chemistry and interfaces shape the formation, performance, and stability of halide perovskite solar cells.", "Ich untersuche, wie Chemie und Grenzflächen die Entstehung, Leistung und Stabilität von Halogenid-Perowskit-Solarzellen beeinflussen.", "我研究化学过程和界面如何影响卤化物钙钛矿太阳能电池的形成、性能与稳定性。"],
    ["Explore publications", "Publikationen entdecken", "浏览论文"],
    ["Stuttgart, Germany", "Stuttgart, Deutschland", "德国斯图加特"],
    ["THE RESEARCHER", "FORSCHERPROFIL", "研究者"],
    ["Institute for Photovoltaics (ipv)", "Institut für Photovoltaik (ipv)", "光伏研究所（ipv）"],
    ["Institute for Photovoltaics", "Institut für Photovoltaik", "光伏研究所"],
    ["Institutional profile", "Universitätsprofil", "机构主页"],
    ["RESEARCH THEMES", "FORSCHUNGSSCHWERPUNKTE", "研究方向"],
    ["Understanding materials, interfaces,", "Materialien und Grenzflächen verstehen", "理解材料与界面，"],
    ["and stability for", "und Stabilität für", "以提升"],
    ["resilient perovskite solar cells.", "robuste Perowskit-Solarzellen.", "钙钛矿太阳能电池的稳定性。"],
    ["CRYSTALLIZATION", "KRISTALLISATION", "结晶"],
    ["Crystallization & phase control", "Kristallisation und Phasenkontrolle", "结晶与相调控"],
    ["Understanding how precursor coordination, solvent removal, and molecular additives govern perovskite film formation and phase stability.", "Wir untersuchen, wie Vorstufenkoordination, Lösungsmittelentfernung und molekulare Additive die Filmbildung und Phasenstabilität von Perowskiten steuern.", "研究前驱体配位、溶剂去除与分子添加剂如何调控钙钛矿薄膜形成和相稳定性。"],
    ["Coordination chemistry", "Koordinationschemie", "配位化学"],
    ["Related publication", "Zugehörige Publikation", "相关论文"],
    ["INTERFACES", "GRENZFLÄCHEN", "界面"],
    ["Functional interfaces & lead-free materials", "Funktionale Grenzflächen und bleifreie Materialien", "功能界面与无铅材料"],
    ["Using organic molecules, polymers, and low-dimensional materials to manage defects, ion migration, and charge transport in lead- and tin-based devices.", "Mit organischen Molekülen, Polymeren und niedrigdimensionalen Materialien beeinflussen wir Defekte, Ionenmigration und Ladungstransport in bleihaltigen und zinnbasierten Bauelementen.", "利用有机分子、聚合物和低维材料调控含铅及锡基器件中的缺陷、离子迁移和电荷传输。"],
    ["Interface passivation", "Grenzflächenpassivierung", "界面钝化"],
    ["Tin perovskites", "Zinn-Perowskite", "锡基钙钛矿"],
    ["STABILITY", "STABILITÄT", "稳定性"],
    ["Stability under realistic stress", "Stabilität unter realistischen Belastungen", "实际应力条件下的稳定性"],
    ["Investigating how temperature changes, light cycling, and moisture affect perovskite devices, and how materials design can improve their resilience.", "Wir untersuchen die Auswirkungen von Temperaturwechseln, Lichtzyklen und Feuchtigkeit auf Perowskit-Bauelemente und wie Materialdesign ihre Beständigkeit verbessern kann.", "研究温度变化、光照循环和湿度对钙钛矿器件的影响，以及如何通过材料设计提高其耐受性。"],
    ["Light & thermal cycling", "Licht- und Temperaturzyklen", "光照与热循环"],
    ["Reliability", "Zuverlässigkeit", "可靠性"],
    ["INTERACTIVE PHOTOVOLTAICS", "INTERAKTIVE PHOTOVOLTAIK", "交互式光伏工具"],
    ["Solar cell", "Solarzellen-", "太阳能电池"],
    ["calculators.", "Rechner.", "计算器。"],
    ["Explore resistance losses, bandgap limits and EQE-integrated current.", "Untersuchen Sie Widerstandsverluste, Bandlückengrenzen und den aus der EQE integrierten Strom.", "探索电阻损失、带隙限制和 EQE 积分电流。"],
    ["01 / SPECTRAL LIMIT", "01 / SPEKTRALGRENZE", "01 / 光谱极限"],
    ["Bandgap → Jsc", "Bandlücke → Jsc", "带隙 → Jsc"],
    ["02 / SPECTRAL RESPONSE", "02 / SPEKTRALE ANTWORT", "02 / 光谱响应"],
    ["EQE integration", "EQE-Integration", "EQE 积分"],
    ["03 / COMBINED", "03 / KOMBINIERT", "03 / 综合"],
    ["Effect of Both Resistances Calculator", "Rechner für Serien- und Parallelwiderstand", "串联与并联电阻综合计算器"],
    ["Enable JavaScript to use these calculators.", "Aktivieren Sie JavaScript, um die Rechner zu nutzen.", "请启用 JavaScript 以使用计算器。"],
    ["Reference AM1.5 spectra.", "AM1.5-Referenzspektren.", "AM1.5 参考光谱。"],
    ["SELECTED PUBLICATIONS", "AUSGEWÄHLTE PUBLIKATIONEN", "代表性论文"],
    ["Representative papers from my research", "Ausgewählte Arbeiten aus meiner Forschung", "我的代表性研究论文"],
    ["on perovskite photovoltaics.", "zur Perowskit-Photovoltaik.", "聚焦钙钛矿光伏。"],
    ["Journal articles, reviews, and perspectives — browse a selection or explore the full list.", "Fachartikel, Übersichten und Perspektiven – sehen Sie sich eine Auswahl oder die vollständige Liste an.", "浏览精选研究论文、综述与观点文章，或查看完整列表。"],
    ["Browse all publications", "Alle Publikationen durchsuchen", "浏览全部论文"],
    ["Selected", "Auswahl", "精选"],
    ["All publications", "Alle Publikationen", "全部论文"],
    ["Search publications", "Publikationen suchen", "搜索论文"],
    ["Search title, author, journal…", "Titel, Autor oder Zeitschrift suchen…", "搜索题名、作者或期刊…"],
    ["Clear search", "Suche löschen", "清除搜索"],
    ["Filter by year", "Nach Jahr filtern", "按年份筛选"],
    ["All years", "Alle Jahre", "所有年份"],
    ["Download full BibTeX", "Vollständiges BibTeX herunterladen", "下载完整 BibTeX"],
    ["Selected publications", "Ausgewählte Publikationen", "精选论文"],
    ["Newest first", "Neueste zuerst", "按时间倒序"],
    ["Correction ↗", "Korrektur ↗", "更正 ↗"],
    ["View more publications", "Weitere Publikationen anzeigen", "查看更多论文"],
    ["Bibliography checked", "Bibliografie geprüft am", "书目核查于"],
    ["31 August 2026", "31. August 2026", "2026年8月31日"],
    [". Duplicate Scholar records are consolidated; corrections are linked to the original articles.", ". Doppelte Scholar-Einträge wurden zusammengeführt; Korrekturen sind mit den Originalartikeln verknüpft.", "。已合并 Google Scholar 的重复记录；更正与原论文相互链接。"],
    ["View Google Scholar ↗", "Google Scholar ansehen ↗", "查看 Google Scholar ↗"],
    ["Enable JavaScript for the searchable 44-publication list, or download the complete BibTeX bibliography above.", "Aktivieren Sie JavaScript für die durchsuchbare Liste mit 44 Publikationen oder laden Sie oben die vollständige BibTeX-Bibliografie herunter.", "启用 JavaScript 可搜索全部 44 篇论文；也可以下载上方完整的 BibTeX 书目。"],
    ["03 / ABOUT", "03 / ÜBER MICH", "03 / 关于"],
    ["From material formation", "Von der Materialbildung", "从材料形成"],
    ["to device performance.", "zur Bauelementleistung.", "到器件性能。"],
    ["I am a postdoctoral researcher in the Emerging Materials group at the Institute for Photovoltaics, University of Stuttgart. My work brings together materials chemistry, thin-film crystallization, and device physics to understand and improve perovskite photovoltaics.", "Ich arbeite als Postdoc in der Gruppe Emerging Materials am Institut für Photovoltaik der Universität Stuttgart. Meine Forschung verbindet Materialchemie, Dünnschichtkristallisation und Bauelementphysik, um die Perowskit-Photovoltaik besser zu verstehen und weiterzuentwickeln.", "我是斯图加特大学光伏研究所新兴材料团队的博士后研究员。我的研究结合材料化学、薄膜结晶和器件物理，以理解并改进钙钛矿光伏器件。"],
    ["My publications explore coordination chemistry and phase formation, functional interfaces, and the response of solar cells to light, temperature, and moisture. Related work spans lead-free tin perovskites, flexible devices, and collaborative efforts on scalable photovoltaic modules.", "Meine Publikationen befassen sich mit Koordinationschemie und Phasenbildung, funktionalen Grenzflächen sowie der Reaktion von Solarzellen auf Licht, Temperatur und Feuchtigkeit. Weitere Arbeiten behandeln bleifreie Zinn-Perowskite, flexible Bauelemente und gemeinsame Forschung an skalierbaren Photovoltaikmodulen.", "我的论文涵盖配位化学与相形成、功能界面，以及太阳能电池对光照、温度和湿度的响应。相关研究还涉及无铅锡基钙钛矿、柔性器件和可规模化光伏组件的合作开发。"],
    ["AFFILIATION", "INSTITUT", "所属机构"],
    ["WORKGROUP", "ARBEITSGRUPPE", "研究团队"],
    ["Emerging Materials", "Emerging Materials", "新兴材料"],
    ["RESEARCH AREA", "FORSCHUNGSGEBIET", "研究领域"],
    ["Halide perovskites", "Halogenid-Perowskite", "卤化物钙钛矿"],
    ["Research in numbers.", "Forschung in Zahlen.", "研究数据概览。"],
    ["All time", "Gesamt", "全部时间"],
    ["Since 2021", "Seit 2021", "自 2021 年起"],
    ["Citations", "Zitationen", "引用次数"],
    ["Total citations received", "Zitationen insgesamt", "总引用次数"],
    ["Publications and citation impact", "Publikationen und Zitationswirkung", "论文及引用影响"],
    ["Publications with ≥10 citations", "Publikationen mit ≥10 Zitationen", "引用至少 10 次的论文"],
    ["Full Google Scholar profile ·", "Vollständiges Google-Scholar-Profil ·", "完整 Google Scholar 主页 ·"],
    ["Last checked", "Zuletzt geprüft", "上次核查"],
    ["View citation profile", "Zitationsprofil ansehen", "查看引用主页"],
    ["04 / UPDATES", "04 / AKTUELLES", "04 / 动态"],
    ["Research in focus.", "Forschung im Fokus.", "研究动态。"],
    ["Recent collaborative work,", "Aktuelle gemeinsame Forschung,", "近期合作研究，"],
    ["featured by the university.", "vorgestellt von der Universität.", "由大学报道。"],
    ["25 FEB 2026", "25. FEB 2026", "2026 年 2 月 25 日"],
    ["17 DEC 2025", "17. DEZ 2025", "2025 年 12 月 17 日"],
    ["UNIVERSITY NEWS · NATURE ENERGY", "UNIVERSITÄTSNACHRICHTEN · NATURE ENERGY", "大学新闻 · NATURE ENERGY"],
    ["UNIVERSITY NEWS · SCIENCE", "UNIVERSITÄTSNACHRICHTEN · SCIENCE", "大学新闻 · SCIENCE"],
    ["Making grain boundaries more resilient.", "Korngrenzen widerstandsfähiger machen.", "提高晶界的耐受性。"],
    ["Photoswitchable molecules help perovskite solar cells withstand changing light conditions.", "Photoschaltbare Moleküle helfen Perowskit-Solarzellen, wechselnde Lichtbedingungen zu überstehen.", "光响应分子帮助钙钛矿太阳能电池应对变化的光照条件。"],
    ["Towards scalable, more sustainable modules.", "Auf dem Weg zu skalierbaren, nachhaltigeren Modulen.", "迈向可规模化、更可持续的组件。"],
    ["Collaborative research on solvent systems for commercially viable perovskite photovoltaics.", "Gemeinsame Forschung zu Lösungsmittelsystemen für wirtschaftlich nutzbare Perowskit-Photovoltaik.", "围绕具有商业应用潜力的钙钛矿光伏组件开展溶剂体系合作研究。"],
    ["05 / CONTACT", "05 / KONTAKT", "05 / 联系"],
    ["Let’s talk", "Sprechen wir", "欢迎交流"],
    ["about the science.", "über Forschung.", "科研问题。"],
    ["For research discussions and academic enquiries.", "Für wissenschaftlichen Austausch und akademische Anfragen.", "欢迎科研交流与学术咨询。"],
    ["Copy email address", "E-Mail-Adresse kopieren", "复制邮箱地址"],
    ["INSTITUTE FOR PHOTOVOLTAICS", "INSTITUT FÜR PHOTOVOLTAIK", "光伏研究所"],
    ["70569 Stuttgart, Germany", "70569 Stuttgart, Deutschland", "德国斯图加特 70569"],
    ["Room 0.215", "Raum 0.215", "0.215 室"],
    ["Institutional contact page", "Kontaktseite des Instituts", "机构联系页面"],
    ["Materials. Interfaces. Photovoltaics.", "Materialien. Grenzflächen. Photovoltaik.", "材料。界面。光伏。"],
    ["Back to top", "Nach oben", "返回顶部"],
    ["PUBLICATION DETAILS", "PUBLIKATIONSDETAILS", "论文详情"],
    ["Close publication details", "Publikationsdetails schließen", "关闭论文详情"],
    ["Copy BibTeX", "BibTeX kopieren", "复制 BibTeX"],
    ["Main navigation", "Hauptnavigation", "主导航"],
    ["Language", "Sprache", "语言"],
    ["Weiwei Zuo home", "Startseite von Weiwei Zuo", "左巍巍的主页"],
    ["Switch to dark mode", "Zum dunklen Modus wechseln", "切换到深色模式"],
    ["Switch to light mode", "Zum hellen Modus wechseln", "切换到浅色模式"],
    ["Open navigation", "Navigation öffnen", "打开导航菜单"],
    ["Close navigation", "Navigation schließen", "关闭导航菜单"],
    ["Researcher profile", "Forscherprofil", "研究者简介"],
    ["Portrait of Weiwei Zuo", "Porträt von Weiwei Zuo", "左巍巍肖像"],
    ["Publication selection", "Publikationsauswahl", "论文筛选"],
    ["Solar cell calculators", "Solarzellen-Rechner", "太阳能电池计算器"],
    ["Conceptual 3D illustration of precursor species assembling into a perovskite crystal lattice", "Konzeptionelle 3D-Illustration der Bildung eines Perowskitkristallgitters aus Vorstufen", "前驱体组装形成钙钛矿晶格的概念性三维插图"],
    ["Conceptual 3D illustration of molecular passivation and charge transport at perovskite device interfaces", "Konzeptionelle 3D-Illustration molekularer Passivierung und des Ladungstransports an Perowskit-Grenzflächen", "钙钛矿器件界面分子钝化与电荷传输的概念性三维插图"],
    ["Conceptual 3D illustration of a perovskite photovoltaic device under light, moisture, and temperature cycling", "Konzeptionelle 3D-Illustration einer Perowskit-Solarzelle unter Licht-, Feuchte- und Temperaturzyklen", "钙钛矿光伏器件经历光照、湿度和温度循环的概念性三维插图"],
    ["Citation statistics period", "Zeitraum der Zitationsstatistik", "引用统计时段"],
    ["Citation for", "Zitat für", "引用格式："],
    ["BibTeX copied to clipboard.", "BibTeX in die Zwischenablage kopiert.", "BibTeX 已复制到剪贴板。"],
    ["Copy unavailable. The BibTeX is selected for manual copying.", "Kopieren nicht möglich. BibTeX ist zum manuellen Kopieren markiert.", "无法自动复制。已选中 BibTeX，请手动复制。"],
    ["Email address copied.", "E-Mail-Adresse kopiert.", "邮箱地址已复制。"],
    ["Copy unavailable. Please select the email address to copy it.", "Kopieren nicht möglich. Bitte markieren Sie die E-Mail-Adresse.", "无法自动复制。请选中邮箱地址后手动复制。"],
    ["Cite", "Zitieren", "引用"],
    ["Reset filters", "Filter zurücksetzen", "重置筛选"],
    ["No publications match these filters.", "Keine Publikationen entsprechen diesen Filtern.", "没有符合筛选条件的论文。"],
    ["Google Scholar ↗", "Google Scholar ↗", "Google Scholar ↗"],
    ["DOI ↗", "DOI ↗", "DOI ↗"]
  ];
  rows.push(
    ["Explore the cell", "Solarzelle untersuchen", "探索太阳能电池"],
    ["Set the ideal reference, then adjust Rₛ and Rₛₕ.", "Legen Sie die ideale Referenz fest und ändern Sie dann Rₛ und Rₛₕ.", "先设置理想参考器件，再调整 Rₛ 和 Rₛₕ。"],
    ["Example parameters", "Beispielparameter", "示例参数"],
    ["Perovskite-like · n = 1.50", "Perowskitähnlich · n = 1,50", "类钙钛矿 · n = 1.50"],
    ["High-FF example · n = 1.00", "Beispiel mit hohem FF · n = 1,00", "高 FF 示例 · n = 1.00"],
    ["Silicon-like · illustrative", "Siliziumähnlich · illustrativ", "类硅器件 · 示意"],
    ["Custom parameters", "Eigene Parameter", "自定义参数"],
    ["Reference open-circuit voltage Vₒ꜀,₀", "Referenz-Leerlaufspannung Vₒ꜀,₀", "参考开路电压 Vₒ꜀,₀"],
    ["Reference short-circuit density Jₛ꜀,₀", "Referenz-Kurzschlussstromdichte Jₛ꜀,₀", "参考短路电流密度 Jₛ꜀,₀"],
    ["Active area A", "Aktive Fläche A", "有效面积 A"],
    ["Use the illuminated active area, excluding inactive borders. 1 cm² = 100 mm².", "Verwenden Sie die beleuchtete aktive Fläche ohne inaktive Ränder. 1 cm² = 100 mm².", "输入受光有效面积，不包含无效边缘。1 cm² = 100 mm²。"],
    ["Model ideality factor n", "Modell-Idealitätsfaktor n", "模型理想因子 n"],
    ["Cell temperature T", "Zelltemperatur T", "电池温度 T"],
    ["n is constant along each model curve. A measured light-intensity ideality factor may differ.", "n bleibt entlang jeder Modellkurve konstant. Ein aus der Lichtintensität gemessener Idealitätsfaktor kann davon abweichen.", "每条模型曲线中的 n 保持不变；由光强测得的理想因子可能不同。"],
    ["Series resistance Rₛ", "Serienwiderstand Rₛ", "串联电阻 Rₛ"],
    ["Series resistance (Ω·cm²)", "Serienwiderstand (Ω·cm²)", "串联电阻（Ω·cm²）"],
    ["Adjust series resistance", "Serienwiderstand einstellen", "调整串联电阻"],
    ["0 · ideal", "0 · ideal", "0 · 理想"],
    ["Use the number field for small Rₛ values (0.01 steps).", "Für kleine Rₛ-Werte das Zahlenfeld verwenden (Schritte von 0,01).", "较小的 Rₛ 值请使用数字输入框（步长 0.01）。"],
    ["Shunt resistance Rₛₕ", "Parallelwiderstand Rₛₕ", "并联电阻 Rₛₕ"],
    ["Shunt resistance (Ω·cm²)", "Parallelwiderstand (Ω·cm²)", "并联电阻（Ω·cm²）"],
    ["Adjust shunt resistance (logarithmic scale)", "Parallelwiderstand einstellen (logarithmische Skala)", "调整并联电阻（对数刻度）"],
    ["10⁶ · log scale", "10⁶ · Log-Skala", "10⁶ · 对数刻度"],
    ["Infinite Rₛₕ (no leakage)", "Unendlicher Rₛₕ (kein Leckstrom)", "Rₛₕ 无穷大（无漏电）"],
    ["Estimate n from a Vₒ꜀–light slope", "n aus der Vₒ꜀-Licht-Kennlinie abschätzen", "由 Vₒ꜀–光强斜率估算 n"],
    ["Enter a fitted slope from stabilized Vₒ꜀ versus light intensity at the cell temperature above.", "Geben Sie die angepasste Steigung von stabilisiertem Vₒ꜀ gegenüber der Lichtintensität bei der oben angegebenen Zelltemperatur ein.", "输入在上述电池温度下稳定态 Vₒ꜀ 随光强变化的拟合斜率。"],
    ["Light-intensity axis", "Lichtintensitätsachse", "光强坐标轴"],
    ["log₁₀(intensity) · per decade", "log₁₀(Intensität) · pro Dekade", "log₁₀（光强）· 每十倍变化"],
    ["ln(intensity) · natural log", "ln(Intensität) · natürlicher Logarithmus", "ln（光强）· 自然对数"],
    ["Vₒ꜀ slope", "Vₒ꜀-Steigung", "Vₒ꜀ 斜率"],
    ["Use estimate as model n", "Schätzwert als Modell-n übernehmen", "将估算值用作模型 n"],
    ["Applying this value is a modeling assumption. Use a consistent preconditioning and settling protocol; report the fitted light range. Local slopes can vary with intensity. n alone does not identify a recombination mechanism.", "Die Übernahme dieses Werts ist eine Modellannahme. Verwenden Sie ein einheitliches Vorbehandlungs- und Stabilisierungsprotokoll und geben Sie den angepassten Lichtintensitätsbereich an. Lokale Steigungen können variieren; n allein identifiziert keinen Rekombinationsmechanismus.", "采用该值是一项建模假设。请使用一致的预处理和稳定流程，并报告拟合的光强范围。局部斜率可能随光强变化；仅凭 n 无法确定复合机制。"],
    ["Illumination & reference settings", "Beleuchtung und Referenzeinstellungen", "光照与参考参数"],
    ["The visible voltage and short-circuit density define the reference cell (Rₛ = 0, Rₛₕ = ∞). Jₗ = Jₛ꜀,₀; J₀ is recalculated at the selected n and T.", "Die angegebene Spannung und Kurzschlussstromdichte definieren die Referenzzelle (Rₛ = 0, Rₛₕ = ∞). Jₗ = Jₛ꜀,₀; J₀ wird für das gewählte n und T neu berechnet.", "输入的电压和短路电流密度定义参考电池（Rₛ = 0，Rₛₕ = ∞）。Jₗ = Jₛ꜀,₀；J₀ 根据所选 n 和 T 重新计算。"],
    ["Incident power density Pᵢₙ", "Eingestrahlte Leistungsdichte Pᵢₙ", "入射功率密度 Pᵢₙ"],
    ["Pᵢₙ sets the efficiency denominator only. Set Jₗ separately for the chosen illumination. Changing T keeps the entered reference voltage fixed; it does not forecast thermal degradation.", "Pᵢₙ bestimmt nur den Nenner des Wirkungsgrads. Stellen Sie Jₗ für die gewählte Beleuchtung separat ein. Bei Änderung von T bleibt die eingegebene Referenzspannung fest; thermische Degradation wird nicht vorhergesagt.", "Pᵢₙ 仅决定效率计算的分母。所选光照下的 Jₗ 需单独设置。改变 T 时输入的参考电压保持不变；本模型不预测热降解。"],
    ["Reset example", "Beispiel zurücksetzen", "重置示例"],
    ["How close is the target FF?", "Wie nah liegt der Ziel-FF?", "距离目标 FF 还有多远？"],
    ["Target FF (%)", "Ziel-FF (%)", "目标 FF（%）"],
    ["Ideal FF₀ ceiling", "Ideale FF₀-Obergrenze", "理想 FF₀ 上限"],
    ["FF loss from resistances", "FF-Verlust durch Widerstände", "电阻造成的 FF 损失"],
    ["Ideal FF₀ − target", "Idealer FF₀ − Zielwert", "理想 FF₀ − 目标值"],
    ["Resistance requirements for this target", "Widerstandsanforderungen für dieses Ziel", "达到目标所需的电阻条件"],
    ["Each bound varies one resistance while holding the other at its current value, with the same reference Vₒ꜀, Jₛ꜀, n and T. They are separate conditions, not a fitted pair. FF alone cannot determine both resistances.", "Jede Grenze variiert einen Widerstand, während der andere beim aktuellen Wert bleibt; Referenz-Vₒ꜀, Jₛ꜀, n und T bleiben gleich. Es sind getrennte Bedingungen, kein angepasstes Wertepaar. FF allein bestimmt nicht beide Widerstände.", "计算每个边界时，只改变一个电阻，另一个保持当前值；参考 Vₒ꜀、Jₛ꜀、n 和 T 不变。这是两项独立条件，并非拟合得到的一对电阻。仅凭 FF 无法确定两个电阻。"],
    ["FF₀ is the resistance-free limit of this constant-n model, not a universal perovskite limit or a measured pseudo-FF. Losses and margins are in percentage points (pp).", "FF₀ ist die widerstandsfreie Grenze dieses Modells mit konstantem n, keine allgemeine Perowskitgrenze und kein gemessener Pseudo-FF. Verluste und Abstände sind in Prozentpunkten (pp) angegeben.", "FF₀ 是该恒定 n 模型的无电阻损失上限，不是普适的钙钛矿极限，也不是实测伪 FF。损失与差值单位为百分点（pp）。"],
    ["Short-circuit current Iₛ꜀", "Kurzschlussstrom Iₛ꜀", "短路电流 Iₛ꜀"],
    ["Maximum power Pₘₐₓ", "Maximale Leistung Pₘₐₓ", "最大功率 Pₘₐₓ"],
    ["Device Rₛ", "Bauelement-Rₛ", "器件 Rₛ"],
    ["Device Rₛₕ", "Bauelement-Rₛₕ", "器件 Rₛₕ"],
    ["At fixed current density and resistances in Ω·cm², area scales total current and power; FF and efficiency stay the same. This uniform single-cell model does not predict extra losses caused by scaling up a device.", "Bei fester Stromdichte und Widerständen in Ω·cm² skalieren Gesamtstrom und Leistung mit der Fläche; FF und Wirkungsgrad bleiben gleich. Das Modell einer gleichmäßigen Einzelzelle sagt keine zusätzlichen Skalierungsverluste voraus.", "在电流密度及 Ω·cm² 单位电阻不变时，总电流和功率随面积缩放；FF 和效率不变。该均匀单电池模型不预测器件放大带来的额外损失。"],
    ["Result units", "Ergebniseinheiten", "结果单位"],
    ["Per cm²", "Pro cm²", "每 cm²"],
    ["Whole device", "Gesamtes Bauelement", "整个器件"],
    ["Chart type", "Diagrammtyp", "图表类型"],
    ["Calculated curves in the power-generating quadrant. Exact values are listed in the comparison table below.", "Berechnete Kurven im leistungserzeugenden Quadranten. Genaue Werte stehen in der Vergleichstabelle darunter.", "发电象限中的计算曲线。准确数值见下方比较表。"],
    ["Curve legend", "Kurvenlegende", "曲线图例"],
    ["Inspect voltage on the curve", "Spannung auf der Kurve prüfen", "查看曲线上某电压点"],
    ["Fill factor", "Füllfaktor", "填充因子"],
    ["Maximum power density", "Maximale Leistungsdichte", "最大功率密度"],
    ["Maximum device power", "Maximale Bauelementleistung", "器件最大功率"],
    ["Power loss vs. ideal", "Leistungsverlust gegenüber ideal", "相对理想值的功率损失"],
    ["Same reference cell", "Dieselbe Referenzzelle", "相同参考电池"],
    ["Open-circuit voltage", "Leerlaufspannung", "开路电压"],
    ["Short-circuit current density", "Kurzschlussstromdichte", "短路电流密度"],
    ["Short-circuit current", "Kurzschlussstrom", "短路电流"],
    ["Model efficiency", "Modellwirkungsgrad", "模型效率"],
    ["Same cell, four resistance conditions", "Dieselbe Zelle, vier Widerstandsbedingungen", "同一电池的四种电阻条件"],
    ["Model", "Modell", "模型"],
    ["Ideal reference", "Ideale Referenz", "理想参考"],
    ["Series only", "Nur Serienwiderstand", "仅串联电阻"],
    ["Shunt only", "Nur Parallelwiderstand", "仅并联电阻"],
    ["Both resistances", "Beide Widerstände", "两种电阻"],
    ["Export curve data ↓", "Kurvendaten exportieren ↓", "导出曲线数据 ↓"],
    ["Model, units & sources", "Modell, Einheiten und Quellen", "模型、单位与来源"],
    ["The cell is represented by a photocurrent source, a diode, a parallel leakage resistance and a series resistance. The same Jₗ, J₀, n and T are used for all four curves.", "Die Zelle wird durch eine Fotostromquelle, eine Diode, einen parallelen Leckwiderstand und einen Serienwiderstand beschrieben. Für alle vier Kurven gelten dieselben Jₗ, J₀, n und T.", "电池由光生电流源、二极管、并联漏电电阻和串联电阻表示。四条曲线使用相同的 Jₗ、J₀、n 和 T。"],
    ["Background reading and governing equation:", "Hintergrundliteratur und Grundgleichung:", "背景资料与控制方程："],
    ["PVEducation · Fill factor ↗", "PVEducation · Füllfaktor ↗", "PVEducation · 填充因子 ↗"],
    ["PVEducation · Series resistance ↗", "PVEducation · Serienwiderstand ↗", "PVEducation · 串联电阻 ↗"],
    ["PVEducation · Shunt resistance ↗", "PVEducation · Parallelwiderstand ↗", "PVEducation · 并联电阻 ↗"],
    ["PVEducation · Both resistances ↗", "PVEducation · Beide Widerstände ↗", "PVEducation · 两种电阻 ↗"],
    ["Results show the last valid inputs.", "Die Ergebnisse zeigen die letzten gültigen Eingaben.", "结果显示上一次有效输入。"],
    ["Enter a positive slope and a cell temperature of 200–400 K.", "Geben Sie eine positive Steigung und eine Zelltemperatur von 200–400 K ein.", "请输入正斜率及 200–400 K 范围内的电池温度。"],
    ["Correct the cell inputs to update the target check. Other results retain the last valid values.", "Korrigieren Sie die Zelleingaben, um den Zielwert zu prüfen. Andere Ergebnisse behalten die letzten gültigen Werte.", "请修正电池参数以更新目标检查；其他结果保留上一次有效值。"],
    ["Enter a target FF of 50–99.99%. The J–V calculation is unchanged.", "Geben Sie einen Ziel-FF von 50–99,99 % ein. Die J–V-Berechnung bleibt unverändert.", "请输入 50–99.99% 的目标 FF；J–V 计算不受影响。"],
    ["Even n = 1 cannot reach this target at the selected reference voltage and temperature.", "Selbst mit n = 1 ist dieses Ziel bei der gewählten Referenzspannung und Temperatur nicht erreichbar.", "在所选参考电压和温度下，即使 n = 1 也无法达到该目标。"],
    ["With zero resistance losses, all n values in the model range (1–2) can reach this target.", "Ohne Widerstandsverluste können alle n-Werte im Modellbereich (1–2) dieses Ziel erreichen.", "在无电阻损失时，模型范围内的所有 n 值（1–2）均可达到此目标。"],
    ["Not reachable even at Rₛ = 0; increase Rₛₕ.", "Selbst bei Rₛ = 0 nicht erreichbar; erhöhen Sie Rₛₕ.", "即使 Rₛ = 0 也无法达到；请增大 Rₛₕ。"],
    ["Not reachable even at Rₛₕ = ∞; decrease Rₛ.", "Selbst bei Rₛₕ = ∞ nicht erreichbar; verringern Sie Rₛ.", "即使 Rₛₕ = ∞ 也无法达到；请减小 Rₛ。"],
    ["Maximum Rₛ", "Maximaler Rₛ", "最大 Rₛ"],
    ["Minimum Rₛₕ", "Minimaler Rₛₕ", "最小 Rₛₕ"],
    ["(search limit)", "(Suchgrenze)", "（搜索边界）"],
    ["(outside search range)", "(außerhalb des Suchbereichs)", "（超出搜索范围）"],
    ["∞ · no leakage", "∞ · kein Leckstrom", "∞ · 无漏电"],
    ["Current density–voltage", "Stromdichte–Spannung", "电流密度–电压"],
    ["Current–voltage", "Strom–Spannung", "电流–电压"],
    ["Power density–voltage", "Leistungsdichte–Spannung", "功率密度–电压"],
    ["Power–voltage", "Leistung–Spannung", "功率–电压"],
    ["Voltage (V)", "Spannung (V)", "电压（V）"],
    ["Current density (mA/cm²)", "Stromdichte (mA/cm²)", "电流密度（mA/cm²）"],
    ["Current (mA)", "Strom (mA)", "电流（mA）"],
    ["Power density (mW/cm²)", "Leistungsdichte (mW/cm²)", "功率密度（mW/cm²）"],
    ["Power (mW)", "Leistung (mW)", "功率（mW）"],
    ["Close CSV export", "CSV-Export schließen", "关闭 CSV 导出"],
    ["CURVE DATA", "KURVENDATEN", "曲线数据"],
    ["Your CSV is ready", "Ihre CSV-Datei ist bereit", "CSV 文件已准备好"],
    ["If the download does not start, use Download CSV below. In browsers that block downloads, copy the data or save the text below as a .csv file.", "Falls der Download nicht startet, klicken Sie unten auf CSV herunterladen. Wenn der Browser Downloads blockiert, kopieren Sie die Daten oder speichern Sie den Text als .csv-Datei.", "若下载未自动开始，请点击下方的“下载 CSV”。若浏览器阻止下载，可复制数据，或将下方文本保存为 .csv 文件。"],
    ["Download CSV ↓", "CSV herunterladen ↓", "下载 CSV ↓"],
    ["Copy CSV", "CSV kopieren", "复制 CSV"],
    ["View CSV data", "CSV-Daten anzeigen", "查看 CSV 数据"],
    ["CSV data", "CSV-Daten", "CSV 数据"],
    ["CSV copied. Paste it into a text file and save with the .csv extension.", "CSV kopiert. Fügen Sie die Daten in eine Textdatei ein und speichern Sie diese mit der Endung .csv.", "CSV 已复制。请粘贴到文本文件并以 .csv 扩展名保存。"],
    ["Select and copy the CSV text below, then save it with the .csv extension.", "Markieren und kopieren Sie den folgenden CSV-Text und speichern Sie ihn mit der Endung .csv.", "请选中并复制下方 CSV 文本，然后以 .csv 扩展名保存。"],
    ["Download requested. Check your browser's downloads, or use the options above.", "Download gestartet. Prüfen Sie die Downloads Ihres Browsers oder verwenden Sie die Optionen oben.", "已请求下载。请查看浏览器下载记录，或使用上方其他方式。"]
  );
  rows.push(
    ["Absorption edge", "Absorptionskante", "吸收边"],
    ["Set the bandgap and the fraction of above-gap photons collected.", "Stellen Sie die Bandlücke und den Anteil der gesammelten Photonen oberhalb der Bandlücke ein.", "设置带隙和高于带隙的光子收集比例。"],
    ["Bandgap Eɡ", "Bandlücke Eɡ", "带隙 Eɡ"],
    ["Adjust bandgap in eV", "Bandlücke in eV einstellen", "以 eV 调整带隙"],
    ["EQE above the bandgap", "EQE oberhalb der Bandlücke", "带隙以上的 EQE"],
    ["Adjust uniform EQE percentage", "Konstanten EQE-Prozentsatz einstellen", "调整恒定 EQE 百分比"],
    ["100% · ideal", "100 % · ideal", "100% · 理想"],
    ["Compare supplied bandgap table", "Mit der bereitgestellten Bandlückentabelle vergleichen", "对比所提供的带隙表"],
    ["Bandgap vs. short-circuit current", "Bandlücke und Kurzschlussstrom", "带隙与短路电流"],
    ["AM1.5G · step-edge absorption model", "AM1.5G · Modell mit stufenförmiger Absorptionskante", "AM1.5G · 阶跃吸收边模型"],
    ["Calculated short-circuit current density versus bandgap, compared with the supplied bandgap table", "Berechnete Kurzschlussstromdichte über der Bandlücke im Vergleich zur bereitgestellten Tabelle", "计算的短路电流密度随带隙的变化，并与所提供的带隙表比较"],
    ["Supplied table · nominal maximum", "Bereitgestellte Tabelle · nominelles Maximum", "所提供表格 · 标称最大值"],
    ["Absorption cutoff", "Absorptionsgrenze", "吸收截止波长"],
    ["Calculated Jsc", "Berechnetes Jsc", "计算所得 Jsc"],
    ["100% EQE limit", "Grenze bei 100 % EQE", "100% EQE 上限"],
    ["Same bandgap", "Dieselbe Bandlücke", "相同带隙"],
    ["Export bandgap curve ↓", "Bandlückenkurve exportieren ↓", "导出带隙曲线 ↓"],
    ["Use Jsc in resistance lab ↑", "Jsc im Widerstandsrechner verwenden ↑", "将 Jsc 用于电阻计算器 ↑"],
    ["Bandgap model & source table", "Bandlückenmodell und Quelltabelle", "带隙模型与源数据表"],
    ["EQE is constant above the bandgap and zero below it. Every collected photon contributes one electron. This is a photocurrent ceiling for the selected spectrum and EQE, not an efficiency limit or a prediction of Voc.", "Die EQE ist oberhalb der Bandlücke konstant und darunter null. Jedes gesammelte Photon trägt ein Elektron bei. Das Ergebnis ist eine Fotostromobergrenze für das gewählte Spektrum und die EQE, keine Wirkungsgradgrenze und keine Vorhersage von Voc.", "EQE 在带隙以上恒定，在带隙以下为零。每个被收集的光子贡献一个电子。这是给定光谱与 EQE 的光生电流上限，并非效率极限或 Voc 预测。"],
    ["The solid curve integrates the supplied AM1.5G spectrum using hc/q = 1239.841984 eV·nm. The dashed curve preserves all 251 values from the supplied bandgap table (0.50–3.00 eV). That workbook contains values without calculation formulas; its full derivation cannot be recovered. It uses a different approximate wavelength conversion and stepwise current values. The two curves differ by up to 1.1194 mA/cm², which cannot be attributed to rounding alone from the available evidence. The table is an independent comparison and is not used to calibrate the integral. Between listed bandgaps, the table comparison is linearly interpolated.", "Die durchgezogene Kurve integriert das bereitgestellte AM1.5G-Spektrum mit hc/q = 1239,841984 eV·nm. Die gestrichelte Kurve enthält alle 251 Werte der Bandlückentabelle (0,50–3,00 eV). Die Arbeitsmappe enthält Werte ohne Berechnungsformeln; ihre vollständige Herleitung ist nicht rekonstruierbar. Sie verwendet eine andere näherungsweise Wellenlängenumrechnung und stufenweise Stromwerte. Die Kurven weichen um bis zu 1,1194 mA/cm² ab; dies lässt sich anhand der verfügbaren Daten nicht allein durch Rundung erklären. Die Tabelle dient als unabhängiger Vergleich und kalibriert das Integral nicht. Zwischen den angegebenen Bandlücken wird linear interpoliert.", "实线采用 hc/q = 1239.841984 eV·nm 对所提供的 AM1.5G 光谱积分。虚线保留所提供带隙表的全部 251 个数值（0.50–3.00 eV）。原工作簿只有数值、没有计算公式，因此无法恢复完整推导；其波长换算近似值和逐级电流值也不同。两条曲线最大相差 1.1194 mA/cm²，现有证据不足以将差异仅归因于舍入。该表仅作独立比较，不用于校准积分；表中带隙之间采用线性插值。"],
    ["Source:", "Quelle:", "来源："],
    ["; spectral irradiance:", "; spektrale Bestrahlungsstärke:", "；光谱辐照度："],
    [". All 251 table rows and 2,002 spectral samples were checked against the original files.", ". Alle 251 Tabellenzeilen und 2.002 Spektralwerte wurden mit den Originaldateien abgeglichen.", "。全部 251 行表格数据和 2,002 个光谱采样点均与原始文件核对。"],
    ["ASTM G173-03 reference spectrum ↗", "ASTM-G173-03-Referenzspektrum ↗", "ASTM G173-03 参考光谱 ↗"],
    ["Bandgap (eV)", "Bandlücke (eV)", "带隙（eV）"],
    ["Short-circuit density (mA/cm²)", "Kurzschlussstromdichte (mA/cm²)", "短路电流密度（mA/cm²）"],
    ["Wavelength (nm)", "Wellenlänge (nm)", "波长（nm）"],
    ["The resistance lab accepts a reference current density of 1–60 mA/cm².", "Der Widerstandsrechner akzeptiert eine Referenzstromdichte von 1–60 mA/cm².", "电阻计算器接受 1–60 mA/cm² 的参考电流密度。"],
    ["Reference Jsc updated in the resistance lab.", "Referenz-Jsc im Widerstandsrechner aktualisiert.", "电阻计算器中的参考 Jsc 已更新。"],
    ["Enter valid inputs to calculate.", "Geben Sie gültige Werte für die Berechnung ein.", "请输入有效参数以计算。"],
    ["Your EQE spectrum", "Ihr EQE-Spektrum", "您的 EQE 光谱"],
    ["Paste two columns from Excel or import a CSV, TSV or TXT file. Wavelength must be in nm.", "Fügen Sie zwei Spalten aus Excel ein oder importieren Sie eine CSV-, TSV- oder TXT-Datei. Die Wellenlänge muss in nm angegeben sein.", "粘贴 Excel 中的两列数据，或导入 CSV、TSV、TXT 文件。波长单位须为 nm。"],
    ["EQE values are in", "EQE-Werte sind angegeben als", "EQE 数值单位"],
    ["Percent (%) · 0–100", "Prozent (%) · 0–100", "百分比（%）· 0–100"],
    ["Fraction · 0–1", "Anteil · 0–1", "小数 · 0–1"],
    ["Choose Fraction for decimal values such as 0.82; choose Percent for values such as 82. The selected unit is applied when calculating.", "Wählen Sie Anteil für Dezimalwerte wie 0,82 und Prozent für Werte wie 82. Die gewählte Einheit wird bei der Berechnung verwendet.", "0.82 一类小数请选择“小数”，82 一类数值请选择“百分比”。计算时会采用所选单位。"],
    ["Wavelength (nm) & EQE", "Wellenlänge (nm) und EQE", "波长（nm）与 EQE"],
    ["Two columns separated by tabs, commas, semicolons or spaces. An optional wavelength / EQE header is accepted. Use a decimal point.", "Zwei Spalten, getrennt durch Tabulator, Komma, Semikolon oder Leerzeichen. Eine optionale Kopfzeile für Wellenlänge / EQE wird akzeptiert. Verwenden Sie einen Dezimalpunkt.", "两列数据可用制表符、逗号、分号或空格分隔；可包含波长/EQE 表头。请用小数点。"],
    ["Import EQE text data", "EQE-Textdaten importieren", "导入 EQE 文本数据"],
    ["Choose file", "Datei auswählen", "选择文件"],
    ["No file selected", "Keine Datei ausgewählt", "未选择文件"],
    ["Integrate EQE", "EQE integrieren", "积分计算 EQE"],
    ["Load workbook example", "Arbeitsmappenbeispiel laden", "加载工作簿示例"],
    ["Clear", "Löschen", "清空"],
    ["External quantum efficiency", "Externe Quanteneffizienz", "外量子效率"],
    ["EQE chart type", "EQE-Diagrammtyp", "EQE 图表类型"],
    ["Cumulative Jsc", "Kumuliertes Jsc", "累计 Jsc"],
    ["Spectral current", "Spektraler Strom", "光谱电流"],
    ["EQE spectrum or its cumulative integrated short-circuit current", "EQE-Spektrum oder kumulativ integrierter Kurzschlussstrom", "EQE 光谱或其累计积分短路电流"],
    ["Integrated Jsc", "Integriertes Jsc", "积分 Jsc"],
    ["Integration interval", "Integrationsbereich", "积分区间"],
    ["nm · supplied data overlap", "nm · Überlappung der bereitgestellten Daten", "nm · 所提供数据的重叠范围"],
    ["Photon-weighted EQE", "Photonengewichtete EQE", "光子加权 EQE"],
    ["Within this interval", "Innerhalb dieses Bereichs", "在该区间内"],
    ["Export integral data ↓", "Integraldaten exportieren ↓", "导出积分数据 ↓"],
    ["Your imported or pasted EQE stays in this browser. No data is uploaded to a server.", "Ihre importierten oder eingefügten EQE-Daten bleiben in diesem Browser. Es werden keine Daten auf einen Server hochgeladen.", "导入或粘贴的 EQE 数据仅保留在当前浏览器中，不会上传到服务器。"],
    ["EQE integration, coverage & units", "EQE-Integration, Abdeckung und Einheiten", "EQE 积分、覆盖范围与单位"],
    ["All irradiance and EQE wavelength points are merged. Irradiance and EQE are each linearly interpolated between samples. Simpson integration on each interval exactly integrates the resulting cubic expression. This retains the original spectral resolution and accepts irregular EQE spacing.", "Alle Wellenlängenpunkte der Bestrahlungsstärke und EQE werden zusammengeführt. Beide Größen werden zwischen den Stützstellen linear interpoliert. Die Simpson-Integration integriert den resultierenden kubischen Ausdruck in jedem Intervall exakt. So bleibt die ursprüngliche spektrale Auflösung erhalten und unregelmäßige EQE-Abstände sind möglich.", "先合并辐照度与 EQE 的所有波长点，再分别进行线性插值。对每个区间使用 Simpson 积分，可准确积分所得三次表达式，从而保留原始光谱分辨率，并支持不规则的 EQE 采样间距。"],
    ["The integral covers only the overlap between the reference spectrum and the supplied EQE span. EQE is assumed zero outside that span; missing response tails can underestimate a full-device Jsc. Results with nonzero endpoints are flagged. Duplicate wavelengths and values outside the selected EQE unit range are rejected.", "Das Integral umfasst nur den Überlappungsbereich von Referenzspektrum und eingegebener EQE. Außerhalb wird EQE = 0 angenommen; fehlende Randbereiche können Jsc unterschätzen. Ergebnisse mit von null abweichenden Endpunkten werden markiert. Doppelte Wellenlängen und Werte außerhalb des gewählten EQE-Einheitenbereichs werden zurückgewiesen.", "积分仅覆盖参考光谱与所给 EQE 范围的重叠部分；范围外假设 EQE 为零。缺失的响应尾部可能低估完整器件的 Jsc。端点非零的结果会提示；重复波长及超出所选 EQE 单位范围的数值会被拒绝。"],
    ["The supplied example contains 181 EQE points from 300 to 1,200 nm. Its original workbook cached 37.2297434 mA/cm²; reintegration on the complete reference spectrum gives 37.2488907 mA/cm². A 5 nm trapezoid calculation with exact constants gives 37.2301072 mA/cm². These differences reflect the integration grid and constants; the original workbook is preserved.", "Das Beispiel enthält 181 EQE-Punkte von 300 bis 1.200 nm. Die ursprüngliche Arbeitsmappe speicherte 37,2297434 mA/cm²; die erneute Integration über das vollständige Referenzspektrum ergibt 37,2488907 mA/cm². Eine Trapezintegration in 5-nm-Schritten mit exakten Konstanten ergibt 37,2301072 mA/cm². Die Unterschiede beruhen auf Integrationsgitter und Konstanten; die Originaldatei bleibt erhalten.", "示例包含 300–1,200 nm 范围的 181 个 EQE 点。原工作簿缓存值为 37.2297434 mA/cm²；对完整参考光谱重新积分得 37.2488907 mA/cm²；采用精确常数与 5 nm 梯形积分得 37.2301072 mA/cm²。这些差异来自积分网格和常数，原工作簿保持不变。"],
    ["This calculation does not apply spectral-mismatch corrections, device area corrections or EQE bias-light corrections. It computes short-circuit current density from the entered external quantum efficiency.", "Diese Berechnung berücksichtigt weder Spektralfehlanpassung noch Flächen- oder EQE-Biaslicht-Korrekturen. Sie berechnet die Kurzschlussstromdichte aus der eingegebenen externen Quanteneffizienz.", "本计算不包含光谱失配、器件面积或 EQE 偏置光修正；它根据输入的外量子效率求短路电流密度。"],
    ["Reference AM1.5 spectra ↗", "AM1.5-Referenzspektren ↗", "AM1.5 参考光谱 ↗"],
    ["PVEducation · Quantum efficiency ↗", "PVEducation · Quanteneffizienz ↗", "PVEducation · 量子效率 ↗"],
    ["No current result", "Noch kein Stromergebnis", "暂无电流结果"],
    ["Cumulative short-circuit current", "Kumulierter Kurzschlussstrom", "累计短路电流"],
    ["Spectral current contribution", "Spektraler Strombeitrag", "光谱电流贡献"],
    ["Integrated current (mA/cm²)", "Integrierter Strom (mA/cm²)", "积分电流（mA/cm²）"],
    ["Spectral current (mA/cm²/nm)", "Spektraler Strom (mA/cm²/nm)", "光谱电流（mA/cm²/nm）"],
    ["Supplied workbook example", "Bereitgestelltes Arbeitsmappenbeispiel", "所提供工作簿示例"],
    ["Your EQE data", "Ihre EQE-Daten", "您的 EQE 数据"],
    ["Wavelengths sorted in ascending order.", "Wellenlängen aufsteigend sortiert.", "波长已按升序排列。"],
    ["At least one endpoint exceeds 1%; unmeasured response may add current.", "Mindestens ein Endpunkt liegt über 1 %; nicht gemessene Antwort kann weiteren Strom beitragen.", "至少一个端点超过 1%；未测量的响应可能增加电流。"],
    ["Data outside 280–4000 nm has no reference irradiance and is excluded.", "Für Daten außerhalb von 280–4000 nm liegt keine Referenzbestrahlungsstärke vor; sie werden ausgeschlossen.", "280–4000 nm 以外没有参考辐照度数据，已排除。"],
    ["Paste two columns or import a CSV, TSV or TXT file.", "Fügen Sie zwei Spalten ein oder importieren Sie eine CSV-, TSV- oder TXT-Datei.", "请粘贴两列数据，或导入 CSV、TSV、TXT 文件。"]
  );
  rows.push(
    ["Data changed. Select Integrate EQE to update the result.", "Daten geändert. Wählen Sie EQE integrieren, um das Ergebnis zu aktualisieren.", "数据已更改。点击“积分计算 EQE”更新结果。"],
    ["Use a file smaller than 2 MB.", "Verwenden Sie eine Datei unter 2 MB.", "请使用小于 2 MB 的文件。"],
    ["Save the EQE columns as CSV, TSV or TXT, or paste them directly from Excel.", "Speichern Sie die EQE-Spalten als CSV, TSV oder TXT oder fügen Sie sie direkt aus Excel ein.", "请将 EQE 两列保存为 CSV、TSV 或 TXT，或直接从 Excel 粘贴。"],
    ["Unable to read this text file.", "Diese Textdatei konnte nicht gelesen werden.", "无法读取该文本文件。"],
    ["The reference short-circuit density Jₛ꜀,₀ equals the photocurrent density Jₗ. It is independently adjustable together with reference Vₒ꜀,₀; the calculated Vₒ꜀ and Jₛ꜀ include resistance losses. Internally J is in A/cm² and Rₛ, Rₛₕ are in Ω·cm², so J × R is in volts. For cell area A in cm²: R (Ω) = R (Ω·cm²) / A and I (mA) = J (mA/cm²) × A. The ideal reference means Rₛ = 0 and Rₛₕ = ∞; diode recombination remains present.", "Die Referenz-Kurzschlussstromdichte Jₛ꜀,₀ entspricht der Fotostromdichte Jₗ. Sie ist zusammen mit Referenz-Vₒ꜀,₀ unabhängig einstellbar; die berechneten Vₒ꜀ und Jₛ꜀ berücksichtigen Widerstandsverluste. Intern gilt J in A/cm² und Rₛ, Rₛₕ in Ω·cm²; daher ist J × R eine Spannung. Für eine Zellfläche A in cm² gilt: R (Ω) = R (Ω·cm²) / A und I (mA) = J (mA/cm²) × A. Die ideale Referenz setzt Rₛ = 0 und Rₛₕ = ∞ voraus; Diodenrekombination bleibt enthalten.", "参考短路电流密度 Jₛ꜀,₀ 等于光生电流密度 Jₗ，可与参考 Vₒ꜀,₀ 分别调节；计算的 Vₒ꜀ 和 Jₛ꜀ 包含电阻损失。内部 J 单位为 A/cm²，Rₛ 与 Rₛₕ 单位为 Ω·cm²，因此 J × R 的单位为伏特。电池面积 A 以 cm² 计时：R（Ω）= R（Ω·cm²）/ A，I（mA）= J（mA/cm²）× A。理想参考条件为 Rₛ = 0、Rₛₕ = ∞，但仍包含二极管复合。"],
    ["Active area A is entered in cm² (0.000001–10000); 1 cm² = 100 mm². Total device power equals power density × A, and total incident power equals incident power density × A. Both resistance inputs remain area-normalized in Ω·cm²; their device values and target bounds in Ω are divided by A. Keep the same illuminated area for current density and incident power. The model describes one uniformly illuminated cell, not a series-connected module or a geometry-dependent loss model.", "Die aktive Fläche A wird in cm² eingegeben (0,000001–10000); 1 cm² = 100 mm². Die gesamte Bauelementleistung ist Leistungsdichte × A, die gesamte eingestrahlte Leistung ist Bestrahlungsleistungsdichte × A. Beide Widerstandseingaben bleiben flächennormiert in Ω·cm²; ihre Bauelementwerte und Zielgrenzen in Ω werden durch A geteilt. Verwenden Sie dieselbe beleuchtete Fläche für Stromdichte und eingestrahlte Leistung. Das Modell beschreibt eine gleichmäßig beleuchtete Einzelzelle, kein in Reihe geschaltetes Modul und kein geometrieabhängiges Verlustmodell.", "有效面积 A 以 cm² 输入（0.000001–10000）；1 cm² = 100 mm²。器件总功率 = 功率密度 × A，总入射功率 = 入射功率密度 × A。两个电阻输入值仍以 Ω·cm² 面积归一化；相应的器件电阻及目标边界（Ω）均除以 A。计算电流密度和入射功率时应使用相同受光面积。本模型描述均匀受光的单个电池，而非串联组件或依赖几何结构的损失模型。"],
    ["J₀ = Jₗ / [exp(Vₒ꜀,₀ / (n kT/q)) − 1]. FF = Pₘₐₓ / (Vₒ꜀ Jₛ꜀) for densities, or Pₘₐₓ / (Vₒ꜀ Iₛ꜀) for device totals. Power loss = 100 × (1 − Pₘₐₓ/Pₘₐₓ,₀). Efficiency = 100 × output power / incident power, using densities or totals consistently. Power loss is evaluated from the solved curve, not an approximate fill-factor formula.", "J₀ = Jₗ / [exp(Vₒ꜀,₀ / (n kT/q)) − 1]. Für Dichten gilt FF = Pₘₐₓ / (Vₒ꜀ Jₛ꜀), für Gesamtwerte FF = Pₘₐₓ / (Vₒ꜀ Iₛ꜀). Leistungsverlust = 100 × (1 − Pₘₐₓ/Pₘₐₓ,₀). Wirkungsgrad = 100 × Ausgangsleistung / eingestrahlte Leistung; Dichten oder Gesamtwerte müssen einheitlich verwendet werden. Der Leistungsverlust wird aus der gelösten Kurve bestimmt, nicht aus einer Näherungsformel für den Füllfaktor.", "J₀ = Jₗ / [exp(Vₒ꜀,₀ / (n kT/q)) − 1]。以密度计算时 FF = Pₘₐₓ / (Vₒ꜀ Jₛ꜀)；以器件总量计算时 FF = Pₘₐₓ / (Vₒ꜀ Iₛ꜀)。功率损失 = 100 × (1 − Pₘₐₓ/Pₘₐₓ,₀)。效率 = 100 × 输出功率 / 入射功率，计算时须统一使用密度或总量。功率损失取自求解后的曲线，而非近似 FF 公式。"],
    ["FF₀ is solved numerically with Rₛ = 0 and Rₛₕ = ∞ at the selected Vₒ꜀,₀, n and T. The target check uses this same model. Resistance bounds use FF = Pₘₐₓ/(Vₒ꜀ Jₛ꜀) with the recalculated terminal Vₒ꜀ and Jₛ꜀, and search Rₛ = 0–50 or Rₛₕ = 10–10⁶ Ω·cm² plus the no-leakage limit. They are approximate conditional thresholds, not extraction from measured data. The displayed n ceiling assumes zero resistance losses and searches n = 1–2.", "FF₀ wird für Rₛ = 0 und Rₛₕ = ∞ bei gewähltem Vₒ꜀,₀, n und T numerisch gelöst. Die Zielprüfung verwendet dasselbe Modell. Die Widerstandsgrenzen beruhen auf FF = Pₘₐₓ/(Vₒ꜀ Jₛ꜀) mit neu berechneten terminalen Vₒ꜀ und Jₛ꜀; durchsucht werden Rₛ = 0–50 bzw. Rₛₕ = 10–10⁶ Ω·cm² sowie die Grenze ohne Leckstrom. Es handelt sich um angenäherte bedingte Schwellen, nicht um aus Messdaten extrahierte Werte. Die angezeigte n-Obergrenze setzt widerstandsfreie Bedingungen voraus und durchsucht n = 1–2.", "在所选 Vₒ꜀,₀、n 与 T 下，用 Rₛ = 0、Rₛₕ = ∞ 数值求解 FF₀；目标检查使用同一模型。电阻边界按重新计算的端电压 Vₒ꜀、Jₛ꜀ 和 FF = Pₘₐₓ/(Vₒ꜀ Jₛ꜀) 求得，搜索范围为 Rₛ = 0–50 或 Rₛₕ = 10–10⁶ Ω·cm²，并考虑无漏电极限。这些是近似的条件阈值，而非由实测数据提取。显示的 n 上限假设无电阻损失，搜索 n = 1–2。"],
    ["For S = dVₒ꜀/dln(Φ), n = S/(kT/q); for S = dVₒ꜀/dlog₁₀(Φ), n = S/[ln(10) kT/q]. Slopes entered in mV are converted to V. At 300 K, the denominators are 25.852 mV per unit ln(Φ) and 59.526 mV per decade. A light-intensity fit is an effective ideality factor over its measured range; it need not equal the constant n that describes an operating J–V curve. Values near 1 do not by themselves establish radiative recombination. This tool does not infer recombination fractions.", "Für S = dVₒ꜀/dln(Φ) gilt n = S/(kT/q); für S = dVₒ꜀/dlog₁₀(Φ) gilt n = S/[ln(10) kT/q]. Eingegebene Steigungen in mV werden in V umgerechnet. Bei 300 K betragen die Nenner 25,852 mV je Einheit ln(Φ) bzw. 59,526 mV pro Dekade. Eine Lichtintensitätsanpassung liefert einen effektiven Idealitätsfaktor im Messbereich; er muss nicht dem konstanten n einer Betriebs-J–V-Kurve entsprechen. Werte nahe 1 belegen für sich genommen keine strahlende Rekombination. Dieses Werkzeug bestimmt keine Rekombinationsanteile.", "对于 S = dVₒ꜀/dln(Φ)，n = S/(kT/q)；对于 S = dVₒ꜀/dlog₁₀(Φ)，n = S/[ln(10) kT/q]。输入的 mV 斜率会换算为 V。300 K 下，分母分别为每单位 ln(Φ) 的 25.852 mV 和每十倍光强的 59.526 mV。光强拟合得到的是测量范围内的有效理想因子，不一定等于运行 J–V 曲线所用的恒定 n。n 接近 1 本身不能证明辐射复合；本工具不推断复合比例。"],
    ["A measured Suns–Vₒ꜀ curve can support a pseudo-J–V analysis when photocurrent scales with intensity and collection is sufficiently voltage independent. Its difference from measured FF can help assess transport-related losses, subject to those assumptions and consistent stabilization. The resistance-free curve here is a simulation, not a Suns–Vₒ꜀ measurement.", "Eine gemessene Suns–Vₒ꜀-Kurve kann eine Pseudo-J–V-Analyse stützen, wenn der Fotostrom mit der Intensität skaliert und die Sammlung hinreichend spannungsunabhängig ist. Die Differenz zum gemessenen FF kann unter diesen Annahmen und bei einheitlicher Stabilisierung transportbedingte Verluste beleuchten. Die hier gezeigte widerstandsfreie Kurve ist eine Simulation, keine Suns–Vₒ꜀-Messung.", "若光生电流随光强成比例变化，且载流子收集充分不依赖电压，实测 Suns–Vₒ꜀ 曲线可用于伪 J–V 分析。在这些假设及一致的稳定化条件下，与实测 FF 的差值可帮助评估传输相关损失。此处的无电阻曲线是模拟结果，并非 Suns–Vₒ꜀ 测量。"],
    ["Single-cell, uniform-illumination model with constant resistances. It does not include hysteresis, ion migration, breakdown, a second diode, or parameter fitting to measured data. Example presets are not fitted experimental devices. CSV includes all four signed J–V and P–V curves, including points beyond each model’s open-circuit voltage, plus parameters and maximum-power coordinates.", "Einzelzellenmodell bei gleichmäßiger Beleuchtung mit konstanten Widerständen. Hysterese, Ionenmigration, Durchbruch, eine zweite Diode und Parameteranpassung an Messdaten sind nicht enthalten. Die Beispielvorgaben sind keine angepassten experimentellen Bauelemente. Die CSV-Datei enthält alle vier vorzeichenbehafteten J–V- und P–V-Kurven einschließlich Punkten jenseits der jeweiligen Leerlaufspannung sowie Parameter und Koordinaten des maximalen Leistungspunkts.", "这是采用恒定电阻、均匀光照的单电池模型，不包含迟滞、离子迁移、击穿、第二个二极管，也不对实测数据拟合参数。预设示例并非拟合的实验器件。CSV 包含全部四种条件下带符号的 J–V 与 P–V 曲线（包括超过各自开路电压的点）、参数及最大功率点坐标。"],
    ["The selected reference is ASTM G173-03 AM1.5G global tilt from the supplied workbook’s SMARTS2 sheet: 2,002 points from 280 to 4,000 nm. Irradiance is in W·m⁻²·nm⁻¹, wavelength in nm, EQE a fraction, and output in mA/cm². The conversion factor multiplying ∫Eλ λ EQE dλ is q/(hc) × 10⁻¹⁰. The spectrum integrates to", "Die Referenz ist ASTM G173-03 AM1.5G Global Tilt aus dem SMARTS2-Blatt der bereitgestellten Arbeitsmappe: 2.002 Punkte von 280 bis 4.000 nm. Die Bestrahlungsstärke ist in W·m⁻²·nm⁻¹, die Wellenlänge in nm, EQE ein Anteil und die Ausgabe in mA/cm². Der Umrechnungsfaktor vor ∫Eλ λ EQE dλ lautet q/(hc) × 10⁻¹⁰. Das Spektrum integriert sich zu", "所选参考光谱为所提供工作簿 SMARTS2 工作表中的 ASTM G173-03 AM1.5G global tilt，包含 280–4,000 nm 的 2,002 个点。辐照度单位为 W·m⁻²·nm⁻¹，波长为 nm，EQE 为小数，输出为 mA/cm²。∫Eλ λ EQE dλ 前的换算因子为 q/(hc) × 10⁻¹⁰。光谱积分结果为"]
  );
  rows.push(
    ["Vₒ꜀,₀ and Jₛ꜀,₀ set the ideal reference; the results show the cell with the selected resistances (Ω·cm²). Curves show the power-generating region. The solid dot marks the selected model’s maximum power point.", "Vₒ꜀,₀ und Jₛ꜀,₀ legen die ideale Referenz fest; die Ergebnisse zeigen die Zelle mit den gewählten Widerständen (Ω·cm²). Die Kurven zeigen den leistungserzeugenden Bereich. Der ausgefüllte Punkt markiert den maximalen Leistungspunkt des gewählten Modells.", "Vₒ꜀,₀ 和 Jₛ꜀,₀ 定义理想参考；结果显示所选电阻（Ω·cm²）下的电池。曲线为发电区域，实心点标出所选模型的最大功率点。"],
    ["Increasing series resistance or decreasing shunt resistance reduces power. Adjust either resistance to explore its contribution to the combined loss.", "Ein höherer Serienwiderstand oder ein kleinerer Parallelwiderstand verringert die Leistung. Ändern Sie jeweils einen Widerstand, um seinen Beitrag zum Gesamtverlust zu untersuchen.", "串联电阻增大或并联电阻减小都会降低功率。调整任一电阻，观察其对总损失的贡献。"],
    ["The entered photocurrent and incident power produce efficiency above 100%; choose a physically consistent reference cell and illumination.", "Die eingegebenen Werte für Fotostrom und eingestrahlte Leistung ergeben einen Wirkungsgrad über 100 %; wählen Sie physikalisch konsistente Referenz- und Beleuchtungswerte.", "输入的光生电流与入射功率导致效率超过 100%；请选择物理上一致的参考电池及光照参数。"],
    ["Equivalent circuit: photocurrent source, diode and shunt resistor in parallel, connected to a series resistor and output terminals", "Ersatzschaltbild: Fotostromquelle, Diode und Parallelwiderstand parallel, verbunden mit Serienwiderstand und Ausgangsklemmen", "等效电路：光生电流源、二极管及并联电阻并联，再与串联电阻和输出端连接"],
    ["Diode", "Diode", "二极管"],
    ["Sandia PVPMC · Single-diode model ↗", "Sandia PVPMC · Ein-Dioden-Modell ↗", "Sandia PVPMC · 单二极管模型 ↗"],
    ["Solar-cell current density versus voltage", "Solarzellen-Stromdichte über der Spannung", "太阳能电池的电流密度–电压曲线"],
    ["mV/decade", "mV/Dekade", "mV/十倍光强"],
    ["mV / unit ln(Φ)", "mV / Einheit ln(Φ)", "mV / 单位 ln(Φ)"],
    ["PVEducation · Quantum efficiency ↗", "PVEducation · Quanteneffizienz ↗", "PVEducation · 量子效率 ↗"],
    ["No data is uploaded to a server.", "Es werden keine Daten auf einen Server hochgeladen.", "数据不会上传到服务器。"]
  );
  rows.push(
    ["A spectrum needs at least two points.", "Ein Spektrum benötigt mindestens zwei Datenpunkte.", "光谱至少需要两个数据点。"],
    ["Spectrum wavelengths must increase and irradiance must be finite and nonnegative.", "Die Wellenlängen müssen ansteigen; die Bestrahlungsstärke muss endlich und nicht negativ sein.", "光谱波长必须递增，辐照度必须为有限的非负数。"],
    ["Bandgap must be 0.5–3.0 eV.", "Die Bandlücke muss 0,5–3,0 eV betragen.", "带隙须在 0.5–3.0 eV 范围内。"],
    ["Collection must be 0–100%.", "Der Sammlungsanteil muss 0–100 % betragen.", "收集比例须在 0–100% 范围内。"],
    ["Choose EQE in percent or fraction.", "Wählen Sie EQE als Prozentwert oder Anteil.", "请选择 EQE 的百分比或小数单位。"],
    ["Use a text file smaller than 2 MB.", "Verwenden Sie eine Textdatei unter 2 MB.", "请使用小于 2 MB 的文本文件。"],
    ["Percent signs require the Percent (%) setting.", "Prozentzeichen erfordern die Einstellung Prozent (%).", "含百分号的数据须选择“百分比（%）”。"],
    ["Use at most 20,000 EQE points.", "Verwenden Sie höchstens 20.000 EQE-Datenpunkte.", "EQE 数据点不可超过 20,000 个。"],
    ["Enter at least two wavelength / EQE rows.", "Geben Sie mindestens zwei Wellenlängen-/EQE-Zeilen ein.", "请至少输入两行波长/EQE 数据。"]
  );
  const locales = {de: Object.fromEntries(rows.map(([en, de]) => [en, de])), zh: Object.fromEntries(rows.map(([en, , zh]) => [en, zh]))};
  if (typeof module === "object" && module.exports) module.exports = locales;
  if (typeof document === "undefined") return;
  const language = document.documentElement.lang === "de" ? "de" : document.documentElement.lang.toLowerCase().startsWith("zh") ? "zh" : "en";
  const dictionary = locales[language] || {};
  const localized = (de, zh) => language === "de" ? de : zh;
  const dynamic = value => {
    let m;
    if ((m = /^Showing (\d+) of (\d+)( matching| selected)? publications?$/.exec(value))) return localized(`${m[1]} von ${m[2]} ${m[3] === " matching" ? "passenden " : m[3] === " selected" ? "ausgewählten " : ""}Publikationen angezeigt`, `显示 ${m[1]} / ${m[2]} 篇${m[3] === " matching" ? "匹配的" : m[3] === " selected" ? "精选" : ""}论文`);
    if ((m = /^([\d.]+) (electron volts|percent|volts|milliamps per square centimeter|ohm square centimeters)$/.exec(value))) return localized(`${m[1]} ${{"electron volts":"Elektronenvolt","percent":"Prozent","volts":"Volt","milliamps per square centimeter":"Milliampere pro Quadratzentimeter","ohm square centimeters":"Ohm-Quadratzentimeter"}[m[2]]}`, `${m[1]} ${{"electron volts":"电子伏特","percent":"百分比","volts":"伏特","milliamps per square centimeter":"毫安每平方厘米","ohm square centimeters":"欧姆平方厘米"}[m[2]]}`);
    if ((m = /^Since (\d{4})$/.exec(value))) return localized(`Seit ${m[1]}`, `自 ${m[1]} 年起`);
    if ((m = /^Adjust (Reference open-circuit voltage Vₒ꜀,₀|Reference short-circuit density Jₛ꜀,₀)$/.exec(value))) return localized(`${dictionary[m[1]]} einstellen`, `调整${dictionary[m[1]]}`);
    if ((m = /^Citation for (.+)$/.exec(value))) return localized(`Zitat für ${m[1]}`, `引用格式：${m[1]}`);
    if ((m = /^Device at ([\d.e+-]+) cm²$/.exec(value))) return localized(`Bauelement mit ${m[1]} cm²`, `面积为 ${m[1]} cm² 的器件`);
    if ((m = /^(Ideal reference|Series only|Shunt only|Both resistances) · ([\d.]+) K · n = ([\d.]+) · A = ([\d.e+-]+) cm²$/.exec(value))) return `${dictionary[m[1]]} · ${m[2]} K · n = ${m[3]} · A = ${m[4]} cm²`;
    if ((m = /^Incident power: ([\d.e+-]+) mW · Current at maximum power: ([\d.e+-]+) mA$/.exec(value))) return localized(`Eingestrahlte Leistung: ${m[1]} mW · Strom am Leistungspunkt: ${m[2]} mA`, `入射功率：${m[1]} mW · 最大功率点电流：${m[2]} mA`);
    if ((m = /^Ideal: ([\d.]+)%$/.exec(value))) return localized(`Ideal: ${m[1]} %`, `理想值：${m[1]}%`);
    if ((m = /^at ([\d.]+) V · ([\d.e+-]+) (mA(?:\/cm²)?)$/.exec(value))) return localized(`bei ${m[1]} V · ${m[2]} ${m[3]}`, `在 ${m[1]} V · ${m[2]} ${m[3]}`);
    if ((m = /^Effective n ≈ ([\d.]+) at ([\d.]+) K\.(.*)$/.exec(value))) return localized(`Effektives n ≈ ${m[1]} bei ${m[2]} K.${m[3] ? " Außerhalb des Modellbereichs (1–2); der Schätzwert wurde nicht begrenzt." : ""}`, `有效 n ≈ ${m[1]}，温度 ${m[2]} K。${m[3] ? " 超出模型范围（1–2）；估算值未截断。" : ""}`);
    if ((m = /^For this target, the resistance-free model requires n ≲ ([\d.]+)\. Resistance losses leave less room\.$/.exec(value))) return localized(`Für dieses Ziel erfordert das widerstandsfreie Modell n ≲ ${m[1]}. Widerstandsverluste verringern den Spielraum.`, `该目标要求无电阻损失模型中 n ≲ ${m[1]}；电阻损失会进一步缩小余量。`);
    if ((m = /^Current settings meet the ([\d.]+)% target within this model \(FF = ([\d.]+)%\)\.$/.exec(value))) return localized(`Die aktuellen Einstellungen erreichen im Modell das Ziel von ${m[1]} % (FF = ${m[2]} %).`, `当前设置在模型中达到 ${m[1]}% 的目标（FF = ${m[2]}%）。`);
    if ((m = /^The ([\d.]+)% target is within the ideal ceiling\. Current FF is ([\d.]+)%; explore the resistance requirements below\.$/.exec(value))) return localized(`Das Ziel von ${m[1]} % liegt unter der idealen Grenze. Der aktuelle FF beträgt ${m[2]} %; prüfen Sie unten die Widerstandsanforderungen.`, `${m[1]}% 目标低于理想上限。当前 FF 为 ${m[2]}%；请查看下方电阻条件。`);
    if ((m = /^Not reachable with this constant n: the ([\d.]+)% target exceeds FF₀ = ([\d.]+)%, even at Rₛ = 0 and Rₛₕ = ∞\. Changing resistances cannot close this gap\.$/.exec(value))) return localized(`Mit diesem konstanten n nicht erreichbar: Das Ziel von ${m[1]} % übersteigt FF₀ = ${m[2]} %, selbst bei Rₛ = 0 und Rₛₕ = ∞. Andere Widerstände schließen diese Lücke nicht.`, `在此恒定 n 下无法达到：${m[1]}% 目标超过 FF₀ = ${m[2]}%，即使 Rₛ = 0、Rₛₕ = ∞ 也如此。改变电阻无法弥合差距。`);
    if ((m = /^Maximum Rₛ · fixed Rₛₕ = (.+) Ω·cm²$/.exec(value))) return localized(`Maximaler Rₛ · fester Rₛₕ = ${m[1]} Ω·cm²`, `最大 Rₛ · 固定 Rₛₕ = ${m[1]} Ω·cm²`);
    if ((m = /^Minimum Rₛₕ · fixed Rₛ = (.+) Ω·cm²$/.exec(value))) return localized(`Minimaler Rₛₕ · fester Rₛ = ${m[1]} Ω·cm²`, `最小 Rₛₕ · 固定 Rₛ = ${m[1]} Ω·cm²`);
    if ((m = /^Active area: enter 0\.000001–10000 cm²\.$/.exec(value))) return localized("Aktive Fläche: 0,000001–10000 cm² eingeben.", "有效面积：请输入 0.000001–10000 cm²。");
    if ((m = /^(.+): enter ([\d.]+)–([\d.]+)\.$/.exec(value))) return localized(`${m[1]}: ${m[2]}–${m[3]} eingeben.`, `${m[1]}：请输入 ${m[2]}–${m[3]}。`);
    if ((m = /^Uniform EQE: ([\d.]+)%$/.exec(value))) return localized(`Konstante EQE: ${m[1]} %`, `恒定 EQE：${m[1]}%`);
    if ((m = /^Spectrum integral · EQE ([\d.]+)%$/.exec(value))) return localized(`Spektralintegral · EQE ${m[1]} %`, `光谱积分 · EQE ${m[1]}%`);
    if ((m = /^At ([\d.]+) eV: supplied table ([\d.]+) mA\/cm²; spectrum integral at 100% EQE ([\d.]+) mA\/cm²\.$/.exec(value))) return localized(`Bei ${m[1]} eV: Tabelle ${m[2]} mA/cm²; Spektralintegral bei 100 % EQE ${m[3]} mA/cm².`, `带隙 ${m[1]} eV：所提供表格为 ${m[2]} mA/cm²；100% EQE 光谱积分为 ${m[3]} mA/cm²。`);
    if ((m = /^(\d+) EQE points integrated\.(?: Wavelengths sorted in ascending order\.)?$/.exec(value))) return localized(`${m[1]} EQE-Punkte integriert.${value.includes("sorted") ? " Wellenlängen aufsteigend sortiert." : ""}`, `已积分 ${m[1]} 个 EQE 数据点。${value.includes("sorted") ? "波长已按升序排列。" : ""}`);
    if ((m = /^(Supplied workbook example|Your EQE data) · (\d+) points · AM1\.5G$/.exec(value))) return localized(`${dictionary[m[1]]} · ${m[2]} Punkte · AM1.5G`, `${dictionary[m[1]]} · ${m[2]} 个数据点 · AM1.5G`);
    if ((m = /^Measured-range integral: ([\d.]+–[\d.]+) nm\. EQE is assumed zero outside the supplied span\.(.*)$/.exec(value))) return localized(`Integral im Messbereich: ${m[1]} nm. Außerhalb des angegebenen Bereichs wird EQE = 0 angenommen.${m[2].includes("endpoint") ? " Mindestens ein Endpunkt liegt über 1 %; ungemessene Antwort kann zusätzlichen Strom liefern." : ""}${m[2].includes("outside 280") ? " Daten außerhalb von 280–4000 nm sind ausgeschlossen." : ""}`, `测量范围积分：${m[1]} nm。所提供范围外假设 EQE 为零。${m[2].includes("endpoint") ? "至少一个端点超过 1%；未测量响应可能增加电流。" : ""}${m[2].includes("outside 280") ? "已排除 280–4000 nm 以外的数据。" : ""}`);
    if ((m = /^Workbook cached Jsc: ([\d.]+) mA\/cm²\. Full-spectrum difference: \+([\d.]+) mA\/cm² \(([\d.]+)%\)\.$/.exec(value))) return localized(`Jsc der Arbeitsmappe: ${m[1]} mA/cm². Differenz zum vollständigen Spektrum: +${m[2]} mA/cm² (${m[3]} %).`, `工作簿缓存 Jsc：${m[1]} mA/cm²。完整光谱差值：+${m[2]} mA/cm²（${m[3]}%）。`);
    if ((m = /^Line (\d+): enter exactly two numeric columns \(wavelength in nm, EQE\)\. Use a decimal point\.$/.exec(value))) return localized(`Zeile ${m[1]}: Geben Sie genau zwei Zahlenspalten (Wellenlänge in nm, EQE) mit Dezimalpunkt ein.`, `第 ${m[1]} 行：请输入恰好两列数字（波长单位 nm、EQE），并使用小数点。`);
    if ((m = /^Line (\d+): wavelength must be positive and in nm\.$/.exec(value))) return localized(`Zeile ${m[1]}: Die Wellenlänge muss positiv und in nm angegeben sein.`, `第 ${m[1]} 行：波长须为正数，单位为 nm。`);
    if ((m = /^Line (\d+): EQE must be (0–100%|0–1)\.$/.exec(value))) return localized(`Zeile ${m[1]}: EQE muss im Bereich ${m[2]} liegen.`, `第 ${m[1]} 行：EQE 须在 ${m[2]} 范围内。`);
    if ((m = /^Duplicate wavelength ([\d.]+) nm\. Resolve duplicates before integrating\.$/.exec(value))) return localized(`Doppelte Wellenlänge ${m[1]} nm. Entfernen Sie Duplikate vor der Integration.`, `波长 ${m[1]} nm 重复。请先处理重复值再积分。`);
    const referencePrefix = "The selected reference is ASTM G173-03 AM1.5G global tilt from the supplied workbook’s SMARTS2 sheet: 2,002 points from 280 to 4,000 nm. Irradiance is in W·m⁻²·nm⁻¹, wavelength in nm, EQE a fraction, and output in mA/cm². The conversion factor multiplying ∫Eλ λ EQE dλ is q/(hc) × 10⁻¹⁰. The spectrum integrates to";
    if (value.startsWith(referencePrefix)) return dictionary[referencePrefix] + value.slice(referencePrefix.length).replace("and is used without renormalization.", localized("und wird ohne Renormierung verwendet.", "，计算时不进行重新归一化。"));
    return undefined;
  };
  const translate = value => {
    const trimmed = String(value).trim();
    if (!trimmed) return value;
    const replacement = dictionary[trimmed] ?? dynamic(trimmed);
    if (replacement === undefined) return value;
    const start = value.indexOf(trimmed);
    return value.slice(0, start) + replacement + value.slice(start + trimmed.length);
  };
  function translateNode(node) {
    if (node.nodeType === 3) {
      if (node.parentElement?.closest("script,style,textarea,pre,code")) return;
      const result = translate(node.nodeValue);
      if (result !== node.nodeValue) node.nodeValue = result;
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.matches("script,style,textarea,pre,code")) return;
    for (const attr of ["aria-label", "aria-valuetext", "placeholder", "title", "alt"]) {
      const value = node.getAttribute(attr);
      if (value !== null) { const result = translate(value); if (result !== value) node.setAttribute(attr, result); }
    }
    for (const child of node.childNodes) translateNode(child);
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (language !== "en") {
      translateNode(document.body);
      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.type === "characterData") translateNode(mutation.target);
          else if (mutation.type === "attributes") translateNode(mutation.target);
          else for (const node of mutation.addedNodes) translateNode(node);
        }
      });
      observer.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:["aria-label", "aria-valuetext", "placeholder", "title", "alt"]});
    }
    const pages = {en:"index.html", de:"de.html", zh:"zh.html"};
    document.querySelectorAll("[data-language]").forEach(link => {
      link.href = "./" + pages[link.dataset.language] + location.hash;
    });
    window.addEventListener("hashchange", () => document.querySelectorAll("[data-language]").forEach(link => {
      link.href = "./" + pages[link.dataset.language] + location.hash;
    }));
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
