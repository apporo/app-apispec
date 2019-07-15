var contextPath = '/example';
var path = require('path');

module.exports = {
  application: {
    contextPath: contextPath
  },
  plugins: {
    appApispec: {
      contextPath: contextPath,
      apiTokenName: 'x-access-token',
      authenticationUrl: '/tokenify/auth',
      prefixBaseUrl: true,
      specificationFile: path.join(__dirname, '../data/swagger.json'),
      ui: {
        title: 'apispec',
        isButtonExploreEnabled: false
      },
      loginForm: {
        caption: 'Login',
        field: {
          realm: {
            enabled: false,
            id: 'realm',
            label: 'Realm',
            pattern: '^[a-zA-Z0-9-_\.]{1,36}$',
            placeholder: 'Realm must contain only alphabets or digits (1-36 characters)'
          },
          username: {
            id: 'username',
            label: 'Username',
            pattern: '^[a-zA-Z][a-zA-Z0-9-_\.]{3,20}$',
            placeholder: 'Username must be between 3 and 20 characters'
          },
          password: {
            id: 'password',
            label: 'Password',
            pattern: '(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$',
            placeholder: 'Password must contain 1 uppercase, lowercase and number'
          }
        },
        button: {
          submit: {
            label: 'OK'
          }
        }
      },
      uiType: 'swagger-ui-express', // 'swagger-tools'
    },
    appWebweaver: {
      defaultRedirectUrl: path.join(contextPath, '/apispec/docs')
    }
  }
};
