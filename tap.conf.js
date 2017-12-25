var path = require('path');
var pkg = require(path.join(__dirname, './package.json'));
module.exports = {
  monitor: { // 主进程服务配置
    port: 80, // 监听80端口
    proxy_pass: [ // 代理转发规则
      {
        server_name: 'localhost test.tmall.com test.daily.tmall.net',
        rewrite: [
          {
            rule: /^(.+)$/,
            target: 'http://127.0.0.1:9898/$1' // 转发到wormhole服务所在的3000端口
          }
        ]
      },
      {
        server_name: 'g.tbcdn.cn g.assets.daily.taobao.net g-assets.daily.taobao.net g.alicdn.com',
        rewrite: [
          {
            rule: /^(.+)$/,
            target: 'http://127.0.0.1:8000/$1'
          }
        ]
      }
    ]
  },
  server: { // server配置
    commands: [
      {
        command: 'wh-cli link mui/zebra-maneki-tooltip@' + pkg.version // 将当前目录链接到wh目录
      },
      {
        command: 'wh-cli link',
        options: {
          cwd: './demo'
        }
      },
      {
        command: 'tap link' // 将当前目录链接到tap 本地cdn目录
      }
    ],
    workers: [ // 要启动的子进程服务
      {
        command: 'tap monitor --debug',
        monitor: '启动monitor成功'
      },
      {
        command: 'wh-cli server zebra -v test.tmall.com' // 启动wh server
      },
      {
        command: 'tap assets -p 8000' // 在8000端口启动tap assets服务
      },
      {
        command: 'npm run dev'
      }
    ]
  },
  'git-pre-hooks': {
    'pre-commit': 'tap check -m zebra/module --ignoreCore'
  }
};
