/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it
const path = require("path");
const fs = require('fs');


const createCollectionPages = createPage => {
  const collectionTemplate = path.resolve(`src/pages/Collection/collection.js`);
  const collectionsPath = './src/collections';
  return fs
    .readdirSync(collectionsPath)
    .filter(
      item => 
        fs.statSync(path.join(collectionsPath, item)).isFile() &&
        path.extname(item) === '.json'
    ).map(
      item => path.join(collectionsPath, item)
    ).reduce(
      (thumbnails, item) => {
        const pathname = item.replace(/^src\//,'').replace(/\.json$/,'');
        const context = JSON.parse(fs.readFileSync(item));
        createPage({
          path: pathname,
          component: collectionTemplate,
          context: context,
        });
        thumbnails[pathname] = context.sequences[0].canvases[0].thumbnail['@id'];
        return thumbnails;
      }, {}
    );
};

const createExhibitionPages = createPage => {
  const exhibitionTemplate = path.resolve(`src/pages/Exhibition/exhibition.js`);
  const exhibitionsPath = './src/exhibitions';
  fs
    .readdirSync(exhibitionsPath)
    .filter(
      item => 
        fs.statSync(path.join(exhibitionsPath, item)).isFile() &&
        path.extname(item) === '.json'
    ).map(
      item => path.join(exhibitionsPath, item)
    ).forEach(
      item => {
        const pathname = item.replace(/^src\//,'').replace(/\.json$/,'');
        createPage({
          path: pathname,
          component: exhibitionTemplate,
          context: JSON.parse(fs.readFileSync(item))
        });
      }
    );
};

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions
  const collectionThumbnails = createCollectionPages(createPage);
  createExhibitionPages(createPage);
  const mdTemplate = path.resolve(`src/pages/Markdown/markdown.js`);

  return graphql(`
    {
      allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date] }
        limit: 1000
      ) {
        edges {
          node {
            html
            frontmatter {
              path
            }
          }
        }
      }
    }
  `).then(result => {
      console.log(result);
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    result.data.allMarkdownRemark.edges.forEach(({ node }) => {
      const manifestLinks = node.html.match(
        /<a href="(\/(collection|exhibition)s\/.*)">/g
      );
      const thumbnails = (manifestLinks||[]).reduce((t, item) => {
        const pathname = item.split('"')[1].substr(1);
        console.log(node.frontmatter.path, pathname, collectionThumbnails[pathname]);
        if (collectionThumbnails.hasOwnProperty(pathname)) {
          t[pathname] = collectionThumbnails[pathname];
        }
        return t;
      }, {});
      createPage({
        path: node.frontmatter.path,
        component: mdTemplate,
        context: {
          thumbnails: thumbnails,
        }, // additional data can be passed via context
      })
    })
  });
};


exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  if (stage === "build-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /\@canvas\-panel\/(core|slideshow)/,
            use: loaders.null(),
          },
        ],
      },
    })
  }
}