# NoAnki简介
​		**NoAnki**是一款开源的记忆规划学习命令行工具，和知名开源软件**Anki**一样，**NoAnki**同样是基于Supermemo的sm2算法进行构建的，拥有和**Anki**一样的参数配置，唯一的区别是在**NoAnki**中不再需要制作闪卡、牌组和模板等等东西，就可以直接开始愉快的学习之旅，这是**NoAnki**的一大特性也是最初开发的目的，简化各种繁杂的操作，专注于学习和获取知识本身！

​		这个世界是多样性的，用户不一样，复习的内容不一样，用来浏览这些复习内容的客户端也不一样。要开发一款能够展示所有格式文件的内容并且兼顾到每一个用户浏览这些文件内容的行为习惯的软件来规划学习，那似乎不太可能。任何一款记忆软件都是没办法去考虑到所有格式以及所有用户的使用习惯的。庆幸的是**NoAnki**是一个中间层应用，它只帮助你规划复习，不考虑如何展示要复习的内容，也不关心如何制作卡牌，它存在的目的就是简化一切操作，它对所有文件格式开放，同时它对所有用户开放。

> 换言之，就是**NoAnki**作为中间层，它对文件格式没有要求。你喜欢用什么软件去浏览你的复习文件都可以，你想把什么格式的文件作为复习材料都可以。

## 参数详情

| 名称                                 | 作用对象 | 介绍                                                         | 默认值        |
| ------------------------------------ | :------- | :----------------------------------------------------------- | ------------- |
| **步伐 （Steps）**                   | 新文件   | 新文件在学习阶段被标记为@GOOD会按照这个时间间隔进行学习，在最后一个步伐结束后新文件会毕业升级成为复习文件 | ['1m', '10m'] |
| **毕业间隔 （Graduating interval）** | 新文件   | 新文件毕业后到第一次复习的天数间隔                           | 1             |
| **简单间隔 （Easy interval**         | 新文件   | 新文件被标记为@EASY毕业后到第一次复习的天数间隔              | 4             |
| **开始简化 （Starting ease）**       | 新文件   | 新文件的初始难易指数                                         | 2.5           |
| **最大复习数/天**                    | 复习文件 | 每天最多可以复习多少个文件                                   | 200           |
| **简单奖励 （Easy bonus)**           | 复习文件 | 当一个复习文件提前复习且被标记为@EASY，简单奖励会乘以下次复习的时间间隔由此来延迟下次复习，相当于奖励延迟复习。 | 1.3           |
|                                      |          |                                                              |               |
|                                      |          |                                                              |               |
|                                      |          |                                                              |               |
|                                      |          |                                                              |               |
|                                      |          |                                                              |               |



> 跨平台支持 Window, Linux, MacOs, Android

> 资料参考链接

1. *[Application of a computer to improve the results obtained in working with the SuperMemo method](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)*
2. *[The Anki 2.1 scheduler](https://faqs.ankiweb.net/the-anki-2.1-scheduler.html)*
3. *[The 2021 scheduler](https://faqs.ankiweb.net/the-2021-scheduler.html)*
4. *[What spaced repetition algorithm does Anki use?](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)*
5. *[Maxvien/supermemo](https://github.com/Maxvien/supermemo)*
6. *[Deck Options of Anki](https://docs.ankiweb.net/deck-options.html)*
7. *[Studying](https://docs.ankiweb.net/studying.html)*
8. [*anki/rslib/src/scheduler/states](https://github.com/ankitects/anki/tree/main/rslib/src/scheduler/states)*
9. *[anki/pylib/anki/scheduler](https://github.com/ankitects/anki/tree/main/pylib/anki/scheduler)*

