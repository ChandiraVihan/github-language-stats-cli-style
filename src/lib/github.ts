import { graphql } from "@octokit/graphql";

 const graphqlWithAuth = graphql.defaults({                //GitHub api utility
   headers: {
     authorization: `token ${process.env.GITHUB_TOKEN}`,
   },
 });

 export interface Language {
   name: string;
   color: string;
   size: number;
 }