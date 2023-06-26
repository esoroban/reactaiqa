// 1. Import required modules
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
// 2. Export the queryPineconeVectorStoreAndQueryLLM function
export const queryPineconeVectorStoreAndQueryLLM = async (
  client,
  indexName,
  question
) => {
// 3. Start query process
  console.log("Querying Pinecone vector store...");
// 4. Retrieve the Pinecone index
  const index = client.Index(indexName);
// 5. Create query embedding
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);
// 6. Query Pinecone index and return top 10 matches
  let queryResponse = await index.query({
    queryRequest: {
      topK: 10,
      vector: queryEmbedding,
      includeMetadata: true,
      includeValues: true,
    },
  });
// 7. Log the number of matches 
  console.log(`Found ${queryResponse.matches.length} matches...`);
// 8. Log the question being asked
  console.log(`Asking question: ${question}...`);
  if (queryResponse.matches.length) {
// 9. Create an OpenAI instance and load the QAStuffChain
   
    const model = new OpenAI({});
    const chain = loadQAStuffChain(model);
// 10. Extract and concatenate page content from matched documents
    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.pageContent)
      .join(" ");
// 11. Execute the chain with input documents and question
    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: question,
    });
    const language = await model.call(
      `Please define language of ${question} `);
    
      const template = "Please translate {english_ans} to  {language} language";
      const prompt = new PromptTemplate({
        template: template,
        inputVariables: ["english_ans", "language"]
      });

      

const chain2 = new LLMChain({ llm: model, prompt: prompt });



const res2 = await chain2.call({ english_ans: result.text, language:language });


// 12. Log the answer
//////////////////////////////////////////
//Вот эти данные нужно вывести в файле app.js здесь :
// {streamedData && (
//   <div>
//     <h3 className="text-2xl text-gray-400">Дідусь Соробан відповідає</h3>
//     <p className="text-gray-200 rounded-md bg-gray-700 p-4">{streamedData}</p>
//   </div>
// )}
    console.log(`Answer: ${res2.text}`);
  } else {
// 13. Log that there are no matches, so GPT-3 will not be queried
    console.log("Since there are no matches, GPT-3 will not be queried.");
  }
};
///////////////////////