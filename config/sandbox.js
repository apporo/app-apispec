module.exports = {
  plugins: {
    appApispec: {
      apiTokenName: 'x-access-token',
      authenticationUrl: '/tokenify/auth',
      prefixBaseUrl: true,
      ui: {
        title: 'apispec'
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
      }
    }
  }
};
