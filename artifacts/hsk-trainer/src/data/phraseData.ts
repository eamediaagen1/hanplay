export interface Phrase {
  id: string;
  hskLevel: number;
  category: string;
  chinese: string;
  pinyin: string;
  english: string;
}

export const phraseData: Phrase[] = [
  // ─── HSK 1 — Greetings ───────────────────────────────────────────────────────
  { id: "p1-gr1", hskLevel: 1, category: "Greetings",     chinese: "你好！",                   pinyin: "Nǐ hǎo!",                             english: "Hello!" },
  { id: "p1-gr2", hskLevel: 1, category: "Greetings",     chinese: "你好吗？",                 pinyin: "Nǐ hǎo ma?",                          english: "How are you?" },
  { id: "p1-gr3", hskLevel: 1, category: "Greetings",     chinese: "我很好，谢谢。",           pinyin: "Wǒ hěn hǎo, xièxie.",                 english: "I'm fine, thank you." },
  { id: "p1-gr4", hskLevel: 1, category: "Greetings",     chinese: "再见！",                   pinyin: "Zàijiàn!",                            english: "Goodbye!" },
  { id: "p1-gr5", hskLevel: 1, category: "Greetings",     chinese: "早上好！",                 pinyin: "Zǎoshang hǎo!",                       english: "Good morning!" },
  { id: "p1-gr6", hskLevel: 1, category: "Greetings",     chinese: "晚上好！",                 pinyin: "Wǎnshang hǎo!",                       english: "Good evening!" },

  // ─── HSK 1 — Introductions ───────────────────────────────────────────────────
  { id: "p1-in1", hskLevel: 1, category: "Introductions", chinese: "你叫什么名字？",           pinyin: "Nǐ jiào shénme míngzi?",              english: "What is your name?" },
  { id: "p1-in2", hskLevel: 1, category: "Introductions", chinese: "我叫王明。",               pinyin: "Wǒ jiào Wáng Míng.",                  english: "My name is Wang Ming." },
  { id: "p1-in3", hskLevel: 1, category: "Introductions", chinese: "你是哪国人？",             pinyin: "Nǐ shì nǎ guó rén?",                 english: "What country are you from?" },
  { id: "p1-in4", hskLevel: 1, category: "Introductions", chinese: "我是中国人。",             pinyin: "Wǒ shì Zhōngguó rén.",               english: "I am Chinese." },
  { id: "p1-in5", hskLevel: 1, category: "Introductions", chinese: "很高兴认识你。",           pinyin: "Hěn gāoxìng rènshi nǐ.",             english: "Nice to meet you." },

  // ─── HSK 1 — Food & Drink ────────────────────────────────────────────────────
  { id: "p1-fd1", hskLevel: 1, category: "Food & Drink",  chinese: "你想喝什么？",             pinyin: "Nǐ xiǎng hē shénme?",                english: "What would you like to drink?" },
  { id: "p1-fd2", hskLevel: 1, category: "Food & Drink",  chinese: "我想喝水。",               pinyin: "Wǒ xiǎng hē shuǐ.",                  english: "I would like water." },
  { id: "p1-fd3", hskLevel: 1, category: "Food & Drink",  chinese: "这个好吃！",               pinyin: "Zhège hǎo chī!",                     english: "This is delicious!" },
  { id: "p1-fd4", hskLevel: 1, category: "Food & Drink",  chinese: "我喜欢吃米饭。",           pinyin: "Wǒ xǐhuān chī mǐfàn.",              english: "I like eating rice." },
  { id: "p1-fd5", hskLevel: 1, category: "Food & Drink",  chinese: "我不吃肉。",               pinyin: "Wǒ bù chī ròu.",                     english: "I don't eat meat." },

  // ─── HSK 1 — Time ────────────────────────────────────────────────────────────
  { id: "p1-ti1", hskLevel: 1, category: "Time",          chinese: "现在几点？",               pinyin: "Xiànzài jǐ diǎn?",                   english: "What time is it now?" },
  { id: "p1-ti2", hskLevel: 1, category: "Time",          chinese: "今天几号？",               pinyin: "Jīntiān jǐ hào?",                    english: "What is today's date?" },
  { id: "p1-ti3", hskLevel: 1, category: "Time",          chinese: "今天是星期几？",           pinyin: "Jīntiān shì xīngqī jǐ?",             english: "What day of the week is it?" },
  { id: "p1-ti4", hskLevel: 1, category: "Time",          chinese: "我明天有空。",             pinyin: "Wǒ míngtiān yǒu kòng.",             english: "I'm free tomorrow." },

  // ─── HSK 1 — Shopping ────────────────────────────────────────────────────────
  { id: "p1-sh1", hskLevel: 1, category: "Shopping",      chinese: "多少钱？",                 pinyin: "Duōshao qián?",                      english: "How much does it cost?" },
  { id: "p1-sh2", hskLevel: 1, category: "Shopping",      chinese: "一共多少钱？",             pinyin: "Yīgòng duōshao qián?",               english: "How much is the total?" },
  { id: "p1-sh3", hskLevel: 1, category: "Shopping",      chinese: "我要买三个。",             pinyin: "Wǒ yào mǎi sān gè.",                english: "I want to buy three." },
  { id: "p1-sh4", hskLevel: 1, category: "Shopping",      chinese: "太贵了！",                 pinyin: "Tài guì le!",                        english: "Too expensive!" },

  // ─── HSK 1 — Directions ──────────────────────────────────────────────────────
  { id: "p1-di1", hskLevel: 1, category: "Directions",    chinese: "厕所在哪里？",             pinyin: "Cèsuǒ zài nǎlǐ?",                   english: "Where is the restroom?" },
  { id: "p1-di2", hskLevel: 1, category: "Directions",    chinese: "学校在哪里？",             pinyin: "Xuéxiào zài nǎlǐ?",                 english: "Where is the school?" },
  { id: "p1-di3", hskLevel: 1, category: "Directions",    chinese: "在左边。",                 pinyin: "Zài zuǒbiān.",                       english: "It's on the left." },
  { id: "p1-di4", hskLevel: 1, category: "Directions",    chinese: "在右边。",                 pinyin: "Zài yòubiān.",                       english: "It's on the right." },
  { id: "p1-di5", hskLevel: 1, category: "Directions",    chinese: "一直走。",                 pinyin: "Yīzhí zǒu.",                         english: "Go straight ahead." },

  // ─── HSK 2 — Travel ──────────────────────────────────────────────────────────
  { id: "p2-tr1", hskLevel: 2, category: "Travel",        chinese: "请问，地铁站在哪里？",     pinyin: "Qǐngwèn, dìtiě zhàn zài nǎlǐ?",     english: "Excuse me, where is the subway station?" },
  { id: "p2-tr2", hskLevel: 2, category: "Travel",        chinese: "去机场要多长时间？",       pinyin: "Qù jīchǎng yào duō cháng shíjiān?", english: "How long does it take to get to the airport?" },
  { id: "p2-tr3", hskLevel: 2, category: "Travel",        chinese: "我想买一张去北京的票。",   pinyin: "Wǒ xiǎng mǎi yī zhāng qù Běijīng de piào.", english: "I'd like to buy a ticket to Beijing." },
  { id: "p2-tr4", hskLevel: 2, category: "Travel",        chinese: "下一班车几点出发？",       pinyin: "Xià yī bān chē jǐ diǎn chūfā?",     english: "When does the next bus depart?" },
  { id: "p2-tr5", hskLevel: 2, category: "Travel",        chinese: "请在这里停一下。",         pinyin: "Qǐng zài zhèlǐ tíng yīxià.",        english: "Please stop here." },

  // ─── HSK 2 — Restaurant ──────────────────────────────────────────────────────
  { id: "p2-re1", hskLevel: 2, category: "Restaurant",    chinese: "请给我菜单。",             pinyin: "Qǐng gěi wǒ càidān.",               english: "Please give me the menu." },
  { id: "p2-re2", hskLevel: 2, category: "Restaurant",    chinese: "我想点这个。",             pinyin: "Wǒ xiǎng diǎn zhège.",              english: "I'd like to order this." },
  { id: "p2-re3", hskLevel: 2, category: "Restaurant",    chinese: "好吃极了！",               pinyin: "Hǎo chī jí le!",                   english: "It's absolutely delicious!" },
  { id: "p2-re4", hskLevel: 2, category: "Restaurant",    chinese: "再来一碗吧。",             pinyin: "Zài lái yī wǎn ba.",               english: "Bring another bowl please." },
  { id: "p2-re5", hskLevel: 2, category: "Restaurant",    chinese: "服务员，买单！",           pinyin: "Fúwùyuán, mǎi dān!",              english: "Waiter, the bill please!" },

  // ─── HSK 2 — Health ──────────────────────────────────────────────────────────
  { id: "p2-he1", hskLevel: 2, category: "Health",        chinese: "你哪里不舒服？",           pinyin: "Nǐ nǎlǐ bù shūfu?",               english: "Where do you feel unwell?" },
  { id: "p2-he2", hskLevel: 2, category: "Health",        chinese: "我头疼。",                 pinyin: "Wǒ tóuténg.",                       english: "I have a headache." },
  { id: "p2-he3", hskLevel: 2, category: "Health",        chinese: "我需要去医院。",           pinyin: "Wǒ xūyào qù yīyuàn.",             english: "I need to go to the hospital." },
  { id: "p2-he4", hskLevel: 2, category: "Health",        chinese: "你要多休息。",             pinyin: "Nǐ yào duō xiūxi.",               english: "You need to rest more." },
  { id: "p2-he5", hskLevel: 2, category: "Health",        chinese: "我感冒了。",               pinyin: "Wǒ gǎnmào le.",                    english: "I have a cold." },

  // ─── HSK 2 — Daily Conversation ──────────────────────────────────────────────
  { id: "p2-dc1", hskLevel: 2, category: "Daily Life",    chinese: "你今天有空吗？",           pinyin: "Nǐ jīntiān yǒu kòng ma?",         english: "Are you free today?" },
  { id: "p2-dc2", hskLevel: 2, category: "Daily Life",    chinese: "没关系，不用担心。",       pinyin: "Méi guānxi, búyòng dānxīn.",      english: "It's OK, don't worry." },
  { id: "p2-dc3", hskLevel: 2, category: "Daily Life",    chinese: "我打算明天去看电影。",     pinyin: "Wǒ dǎsuàn míngtiān qù kàn diànyǐng.", english: "I plan to watch a movie tomorrow." },
  { id: "p2-dc4", hskLevel: 2, category: "Daily Life",    chinese: "你有什么问题吗？",         pinyin: "Nǐ yǒu shénme wèntí ma?",         english: "Do you have any questions?" },
  { id: "p2-dc5", hskLevel: 2, category: "Daily Life",    chinese: "我最近很忙。",             pinyin: "Wǒ zuìjìn hěn máng.",             english: "I've been very busy recently." },

  // ─── HSK 2 — School & Work ───────────────────────────────────────────────────
  { id: "p2-sw1", hskLevel: 2, category: "School & Work", chinese: "这道题我不明白。",         pinyin: "Zhè dào tí wǒ bù míngbái.",       english: "I don't understand this question." },
  { id: "p2-sw2", hskLevel: 2, category: "School & Work", chinese: "你能帮我一下吗？",         pinyin: "Nǐ néng bāng wǒ yīxià ma?",      english: "Can you help me?" },
  { id: "p2-sw3", hskLevel: 2, category: "School & Work", chinese: "我们一起练习吧。",         pinyin: "Wǒmen yīqǐ liànxí ba.",           english: "Let's practice together." },
  { id: "p2-sw4", hskLevel: 2, category: "School & Work", chinese: "作业做完了吗？",           pinyin: "Zuòyè zuòwán le ma?",             english: "Have you finished your homework?" },
  { id: "p2-sw5", hskLevel: 2, category: "School & Work", chinese: "你学中文多久了？",         pinyin: "Nǐ xué Zhōngwén duō jiǔ le?",    english: "How long have you been studying Chinese?" },

  // ─── HSK 2 — Shopping ────────────────────────────────────────────────────────
  { id: "p2-sh1", hskLevel: 2, category: "Shopping",      chinese: "这件衣服多少钱？",         pinyin: "Zhè jiàn yīfu duōshao qián?",     english: "How much is this piece of clothing?" },
  { id: "p2-sh2", hskLevel: 2, category: "Shopping",      chinese: "有没有便宜一点的？",       pinyin: "Yǒu méiyǒu piányí yīdiǎn de?",   english: "Do you have something cheaper?" },
  { id: "p2-sh3", hskLevel: 2, category: "Shopping",      chinese: "我可以试穿吗？",           pinyin: "Wǒ kěyǐ shì chuān ma?",           english: "Can I try it on?" },
  { id: "p2-sh4", hskLevel: 2, category: "Shopping",      chinese: "有大一点的吗？",           pinyin: "Yǒu dà yīdiǎn de ma?",            english: "Do you have a bigger size?" },
  { id: "p2-sh5", hskLevel: 2, category: "Shopping",      chinese: "我要这个颜色的。",         pinyin: "Wǒ yào zhège yánsè de.",          english: "I want this colour." },

  // ─── HSK 3 — At Work ─────────────────────────────────────────────────────────
  { id: "p3-wo1", hskLevel: 3, category: "At Work",       chinese: "我们下午三点开会。",       pinyin: "Wǒmen xiàwǔ sān diǎn kāi huì.",   english: "We have a meeting at 3 pm this afternoon." },
  { id: "p3-wo2", hskLevel: 3, category: "At Work",       chinese: "这个项目什么时候截止？",   pinyin: "Zhège xiàngmù shénme shíhou jiézhǐ?", english: "When is this project due?" },
  { id: "p3-wo3", hskLevel: 3, category: "At Work",       chinese: "我需要请三天假。",         pinyin: "Wǒ xūyào qǐng sān tiān jià.",     english: "I need to take three days off." },
  { id: "p3-wo4", hskLevel: 3, category: "At Work",       chinese: "能帮我检查一下这份报告吗？",pinyin: "Néng bāng wǒ jiǎnchá yīxià zhè fèn bàogào ma?", english: "Could you help me review this report?" },
  { id: "p3-wo5", hskLevel: 3, category: "At Work",       chinese: "我下周要出差去上海。",     pinyin: "Wǒ xià zhōu yào chū chāi qù Shànghǎi.", english: "I'm going on a business trip to Shanghai next week." },

  // ─── HSK 3 — Travel ──────────────────────────────────────────────────────────
  { id: "p3-tr1", hskLevel: 3, category: "Travel",        chinese: "我想预订一间单人房。",     pinyin: "Wǒ xiǎng yùdìng yī jiān dānrén fáng.", english: "I'd like to book a single room." },
  { id: "p3-tr2", hskLevel: 3, category: "Travel",        chinese: "附近有什么好玩的地方？",   pinyin: "Fùjìn yǒu shénme hǎowán de dìfāng?", english: "Are there any fun places nearby?" },
  { id: "p3-tr3", hskLevel: 3, category: "Travel",        chinese: "我的护照丢了，怎么办？",   pinyin: "Wǒ de hùzhào diū le, zěnme bàn?", english: "I lost my passport, what should I do?" },
  { id: "p3-tr4", hskLevel: 3, category: "Travel",        chinese: "请问，这趟车直达北京吗？", pinyin: "Qǐngwèn, zhè tàng chē zhí dá Běijīng ma?", english: "Does this train go directly to Beijing?" },
  { id: "p3-tr5", hskLevel: 3, category: "Travel",        chinese: "这里的风景真漂亮！",       pinyin: "Zhèlǐ de fēngjǐng zhēn piàoliang!", english: "The scenery here is really beautiful!" },

  // ─── HSK 3 — Health & Body ───────────────────────────────────────────────────
  { id: "p3-he1", hskLevel: 3, category: "Health",        chinese: "我肚子疼，可能吃坏东西了。",pinyin: "Wǒ dùzi téng, kěnéng chī huài dōngxi le.", english: "I have a stomachache, I may have eaten something bad." },
  { id: "p3-he2", hskLevel: 3, category: "Health",        chinese: "你应该多锻炼，注意饮食。", pinyin: "Nǐ yīnggāi duō duànliàn, zhùyì yǐnshí.", english: "You should exercise more and pay attention to your diet." },
  { id: "p3-he3", hskLevel: 3, category: "Health",        chinese: "我发烧了，体温三十九度。", pinyin: "Wǒ fāshāo le, tǐwēn sānshíjiǔ dù.", english: "I have a fever of 39 degrees." },
  { id: "p3-he4", hskLevel: 3, category: "Health",        chinese: "医生说我需要打一针。",     pinyin: "Yīshēng shuō wǒ xūyào dǎ yī zhēn.", english: "The doctor said I need an injection." },
  { id: "p3-he5", hskLevel: 3, category: "Health",        chinese: "最近我睡眠不太好。",       pinyin: "Zuìjìn wǒ shuìmián bú tài hǎo.",  english: "I haven't been sleeping well recently." },

  // ─── HSK 3 — Education ───────────────────────────────────────────────────────
  { id: "p3-ed1", hskLevel: 3, category: "Education",     chinese: "这门课的考试很难。",       pinyin: "Zhè mén kè de kǎoshì hěn nán.",   english: "The exam for this subject is very difficult." },
  { id: "p3-ed2", hskLevel: 3, category: "Education",     chinese: "我需要复习一下语法规则。", pinyin: "Wǒ xūyào fùxí yīxià yǔfǎ guīzé.", english: "I need to review the grammar rules." },
  { id: "p3-ed3", hskLevel: 3, category: "Education",     chinese: "你能用普通话再说一遍吗？", pinyin: "Nǐ néng yòng Pǔtōnghuà zài shuō yī biàn ma?", english: "Can you say that again in Mandarin?" },
  { id: "p3-ed4", hskLevel: 3, category: "Education",     chinese: "我打算明年去中国留学。",   pinyin: "Wǒ dǎsuàn míngnián qù Zhōngguó liúxué.", english: "I plan to study abroad in China next year." },
  { id: "p3-ed5", hskLevel: 3, category: "Education",     chinese: "这篇文章写得很好。",       pinyin: "Zhè piān wénzhāng xiě de hěn hǎo.", english: "This essay is very well written." },

  // ─── HSK 3 — Daily Conversation ──────────────────────────────────────────────
  { id: "p3-dc1", hskLevel: 3, category: "Daily Life",    chinese: "虽然很累，但是我很满意。", pinyin: "Suīrán hěn lèi, dànshì wǒ hěn mǎnyì.", english: "Although I'm tired, I'm very satisfied." },
  { id: "p3-dc2", hskLevel: 3, category: "Daily Life",    chinese: "你最近工作怎么样？",       pinyin: "Nǐ zuìjìn gōngzuò zěnme yàng?",  english: "How has work been for you recently?" },
  { id: "p3-dc3", hskLevel: 3, category: "Daily Life",    chinese: "我已经完成了所有的准备工作。",pinyin: "Wǒ yǐjīng wánchéng le suǒyǒu de zhǔnbèi gōngzuò.", english: "I've already finished all the preparation." },
  { id: "p3-dc4", hskLevel: 3, category: "Daily Life",    chinese: "如果你有困难，可以找我帮忙。",pinyin: "Rúguǒ nǐ yǒu kùnnan, kěyǐ zhǎo wǒ bāngmáng.", english: "If you have difficulties, you can come to me for help." },
  { id: "p3-dc5", hskLevel: 3, category: "Daily Life",    chinese: "这里的环境比我想象的好多了。",pinyin: "Zhèlǐ de huánjìng bǐ wǒ xiǎngxiàng de hǎo duō le.", english: "The environment here is much better than I imagined." },

  // ─── HSK 3 — Shopping ────────────────────────────────────────────────────────
  { id: "p3-sh1", hskLevel: 3, category: "Shopping",      chinese: "这个品牌的质量很好。",     pinyin: "Zhège pǐnpái de zhìliàng hěn hǎo.", english: "This brand has very good quality." },
  { id: "p3-sh2", hskLevel: 3, category: "Shopping",      chinese: "现在打折，很划算。",       pinyin: "Xiànzài dǎzhé, hěn huásuàn.",     english: "It's on sale now, very good value." },
  { id: "p3-sh3", hskLevel: 3, category: "Shopping",      chinese: "我想退换这件商品。",       pinyin: "Wǒ xiǎng tuì huàn zhè jiàn shāngpǐn.", english: "I'd like to return or exchange this item." },
  { id: "p3-sh4", hskLevel: 3, category: "Shopping",      chinese: "这个尺码对我来说太小了。", pinyin: "Zhège chǐmǎ duì wǒ lái shuō tài xiǎo le.", english: "This size is too small for me." },
  { id: "p3-sh5", hskLevel: 3, category: "Shopping",      chinese: "你们有会员卡吗？",         pinyin: "Nǐmen yǒu huìyuán kǎ ma?",        english: "Do you have a membership card?" },

  // ─── HSK 4 — Society & Work ──────────────────────────────────────────────────
  { id: "p4-sw1", hskLevel: 4, category: "Society & Work",  chinese: "这个政策对社会影响很大。",     pinyin: "Zhège zhèngcè duì shèhuì yǐngxiǎng hěn dà.",        english: "This policy has a huge impact on society." },
  { id: "p4-sw2", hskLevel: 4, category: "Society & Work",  chinese: "公民有责任遵守法律。",         pinyin: "Gōngmín yǒu zérèn zūnshǒu fǎlǜ.",                   english: "Citizens have a responsibility to obey the law." },
  { id: "p4-sw3", hskLevel: 4, category: "Society & Work",  chinese: "我们需要共同解决这个问题。",   pinyin: "Wǒmen xūyào gòngtóng jiějué zhège wèntí.",           english: "We need to solve this problem together." },
  { id: "p4-sw4", hskLevel: 4, category: "Society & Work",  chinese: "这家公司的发展速度很快。",     pinyin: "Zhè jiā gōngsī de fāzhǎn sùdù hěn kuài.",           english: "This company is growing very quickly." },
  { id: "p4-sw5", hskLevel: 4, category: "Society & Work",  chinese: "我下个月要参加一个重要会议。", pinyin: "Wǒ xià gè yuè yào cānjiā yīgè zhòngyào huìyì.",      english: "I have an important meeting next month." },

  // ─── HSK 4 — Education & Research ────────────────────────────────────────────
  { id: "p4-ed1", hskLevel: 4, category: "Education",        chinese: "我正在写毕业论文。",           pinyin: "Wǒ zhèngzài xiě bìyè lùnwén.",                       english: "I am writing my graduation thesis." },
  { id: "p4-ed2", hskLevel: 4, category: "Education",        chinese: "他申请了奖学金，结果被录取了。",pinyin: "Tā shēnqǐng le jiǎngxuéjīn, jiéguǒ bèi lùqǔ le.",   english: "He applied for a scholarship and was accepted." },
  { id: "p4-ed3", hskLevel: 4, category: "Education",        chinese: "这门课的理论和实践结合得很好。",pinyin: "Zhè mén kè de lǐlùn hé shíjiàn jiéhé de hěn hǎo.",   english: "This course combines theory and practice very well." },
  { id: "p4-ed4", hskLevel: 4, category: "Education",        chinese: "我的导师建议我研究这个课题。", pinyin: "Wǒ de dǎoshī jiànyì wǒ yánjiū zhège kètí.",           english: "My supervisor suggested I research this topic." },
  { id: "p4-ed5", hskLevel: 4, category: "Education",        chinese: "掌握知识需要长期积累。",       pinyin: "Zhǎngwò zhīshi xūyào chángqī jīlěi.",                english: "Mastering knowledge requires long-term accumulation." },

  // ─── HSK 4 — Business & Economy ──────────────────────────────────────────────
  { id: "p4-bu1", hskLevel: 4, category: "Business",         chinese: "市场需求正在快速增长。",       pinyin: "Shìchǎng xūqiú zhèngzài kuàisù zēngzhǎng.",          english: "Market demand is growing rapidly." },
  { id: "p4-bu2", hskLevel: 4, category: "Business",         chinese: "这次谈判进行得很顺利。",       pinyin: "Zhè cì tánpàn jìnxíng de hěn shùnlì.",               english: "The negotiation went very smoothly." },
  { id: "p4-bu3", hskLevel: 4, category: "Business",         chinese: "我们公司决定进入国际市场。",   pinyin: "Wǒmen gōngsī juédìng jìnrù guójì shìchǎng.",         english: "Our company has decided to enter the international market." },
  { id: "p4-bu4", hskLevel: 4, category: "Business",         chinese: "这个产品的成本需要进一步降低。",pinyin: "Zhège chǎnpǐn de chéngběn xūyào jìnyībù jiàngdī.",   english: "The cost of this product needs to be reduced further." },
  { id: "p4-bu5", hskLevel: 4, category: "Business",         chinese: "良好的客户服务是成功的关键。", pinyin: "Liánghǎo de kèhù fúwù shì chénggōng de guānjiàn.",   english: "Good customer service is the key to success." },

  // ─── HSK 4 — Technology ───────────────────────────────────────────────────────
  { id: "p4-te1", hskLevel: 4, category: "Technology",       chinese: "人工智能正在改变我们的生活方式。",pinyin: "Réngōng zhìnéng zhèngzài gǎibiàn wǒmen de shēnghuó fāngshì.", english: "AI is changing our way of life." },
  { id: "p4-te2", hskLevel: 4, category: "Technology",       chinese: "这个应用程序需要定期更新。",   pinyin: "Zhège yìngyòng chéngxù xūyào dìngqī gēngxīn.",       english: "This application needs to be updated regularly." },
  { id: "p4-te3", hskLevel: 4, category: "Technology",       chinese: "网络安全是一个重要问题。",     pinyin: "Wǎngluò ānquán shì yīgè zhòngyào wèntí.",            english: "Cybersecurity is an important issue." },
  { id: "p4-te4", hskLevel: 4, category: "Technology",       chinese: "云计算让数据存储更加便利。",   pinyin: "Yún jìsuàn ràng shùjù cúnchǔ gèngjiā biànlì.",       english: "Cloud computing makes data storage more convenient." },
  { id: "p4-te5", hskLevel: 4, category: "Technology",       chinese: "请保护好你的个人隐私信息。",   pinyin: "Qǐng bǎohù hǎo nǐ de gèrén yǐnsī xìnxī.",           english: "Please protect your personal privacy information." },

  // ─── HSK 4 — Travel & Culture ────────────────────────────────────────────────
  { id: "p4-tr1", hskLevel: 4, category: "Travel & Culture", chinese: "我需要在大使馆申请签证。",     pinyin: "Wǒ xūyào zài dàshǐguǎn shēnqǐng qiānzhèng.",         english: "I need to apply for a visa at the embassy." },
  { id: "p4-tr2", hskLevel: 4, category: "Travel & Culture", chinese: "这个世界遗产非常值得参观。",   pinyin: "Zhège shìjiè yíchǎn fēicháng zhídé cānguān.",         english: "This World Heritage Site is well worth visiting." },
  { id: "p4-tr3", hskLevel: 4, category: "Travel & Culture", chinese: "我的航班因为天气原因延误了。", pinyin: "Wǒ de hángbān yīnwèi tiānqì yuányīn yánwù le.",       english: "My flight was delayed due to weather conditions." },
  { id: "p4-tr4", hskLevel: 4, category: "Travel & Culture", chinese: "出国旅行前要了解当地的风俗习惯。",pinyin: "Chūguó lǚxíng qián yào liǎojiě dāngdì de fēngsú xíguàn.", english: "Before travelling abroad, learn about local customs." },
  { id: "p4-tr5", hskLevel: 4, category: "Travel & Culture", chinese: "这里的文化遗产有着悠久的历史。",pinyin: "Zhèlǐ de wénhuà yíchǎn yǒuzhe yōujiǔ de lìshǐ.",      english: "The cultural heritage here has a long history." },

  // ─── HSK 4 — Health & Environment ────────────────────────────────────────────
  { id: "p4-he1", hskLevel: 4, category: "Health & Environment", chinese: "医生建议我每天坚持锻炼。", pinyin: "Yīshēng jiànyì wǒ měitiān jiānchí duànliàn.",        english: "The doctor advised me to exercise every day." },
  { id: "p4-he2", hskLevel: 4, category: "Health & Environment", chinese: "保护环境是每个人的责任。", pinyin: "Bǎohù huánjìng shì měi gè rén de zérèn.",            english: "Protecting the environment is everyone's responsibility." },
  { id: "p4-he3", hskLevel: 4, category: "Health & Environment", chinese: "气候变化对地球影响越来越大。",pinyin: "Qìhòu biànhuà duì dìqiú yǐngxiǎng yuè lái yuè dà.", english: "Climate change is having an increasing impact on the Earth." },
  { id: "p4-he4", hskLevel: 4, category: "Health & Environment", chinese: "良好的睡眠对健康非常重要。", pinyin: "Liánghǎo de shuìmián duì jiànkāng fēicháng zhòngyào.", english: "Good sleep is very important for health." },
  { id: "p4-he5", hskLevel: 4, category: "Health & Environment", chinese: "我们应该减少碳排放来保护地球。",pinyin: "Wǒmen yīnggāi jiǎnshǎo tàn páifàng lái bǎohù dìqiú.", english: "We should reduce carbon emissions to protect the Earth." },
];

export function getPhrasesByLevel(level: number): Phrase[] {
  return phraseData.filter((p) => p.hskLevel === level);
}

export function getCategoriesByLevel(level: number): string[] {
  const phrases = getPhrasesByLevel(level);
  return [...new Set(phrases.map((p) => p.category))];
}
