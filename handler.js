'use strict';
const {promises:{readFile}} = require('fs');
class Handler{

  constructor({rekoSvc,translateSvc}){

    this.rekoSvc = rekoSvc
    this.translateSvc = translateSvc

  }
  async translateText(text){
    const params = {
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: text
    }

    const {TranslatedText} = await this.translateSvc.translateText(params).promise()
  
    return TranslatedText.split(' e ')

  }
  async FormatTextResult(texts,workingItems){
    const finalTextItem = []
    for(const indexText in texts){

      const nameInPortuguese = texts[indexText]
      const confidence = workingItems[indexText].Confidence

      finalTextItem.push(`${confidence.toFixed(2)} % de ser do tipo ${nameInPortuguese}`)
     
    }
    return finalTextItem.join('\n')
  }
  async detectImageLabel(buffer){
    const result = await this.rekoSvc.detectLabels({
      Image:{
        Bytes:buffer
      }
    })
    .promise()
    const workingItems = result.Labels.filter(({Confidence})=>Confidence>90)
    const names = workingItems.map(({Name})=>Name)
   
    .join(' and ')
    return {workingItems,names}
  }
  async main(event){
   
    try{
      const imgBuffer = await readFile('./bolsonaro.jpeg')
    const {workingItems,names} = await this.detectImageLabel(imgBuffer)
   
    const texts = await this.translateText(names)
    
    const finshText =  await this.FormatTextResult(texts,workingItems)
      return{
        statusCode: 200,
        body:`A imagem tem `.concat(finshText)
      }
    }catch(err){
      console.log(err)
      return {'statusCode': 500, 'body': 'internal server error'}
    }
  }
}
// factory
const aws = require('aws-sdk');
const reko = new aws.Rekognition()
const translate = new aws.Translate()

const handler = new Handler({
  rekoSvc: reko,
  translateSvc: translate
});

module.exports.main = handler.main.bind(handler)