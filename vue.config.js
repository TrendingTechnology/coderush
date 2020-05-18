module.exports = {
  css: {
    loaderOptions: {
      sass: {
        prependData: `
          @import "@/styles/global.sass"
        `,
        sassOptions: {
          indentedSyntax: true,
        },
      },
    },
  },
};
