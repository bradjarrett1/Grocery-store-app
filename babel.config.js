module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // @opentelemetry packages (pulled in by Supabase) use import(variable)
      // which Hermes cannot compile. Replace with Promise.resolve({}).
      function transformVariableDynamicImport({ types: t }) {
        return {
          visitor: {
            CallExpression(path) {
              if (
                t.isImport(path.node.callee) &&
                path.node.arguments.length > 0 &&
                !t.isStringLiteral(path.node.arguments[0])
              ) {
                path.replaceWith(
                  t.callExpression(
                    t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
                    [t.objectExpression([])]
                  )
                );
              }
            },
          },
        };
      },
    ],
  };
};
