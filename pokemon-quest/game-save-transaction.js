/** Persist successful economic operations, rolling back all in-memory changes on failure. */
export function gameSaveTransaction(game,save,operation){
 const snapshot=JSON.parse(JSON.stringify(game));
 const outcome=operation();
 if(outcome!==true&&outcome?.ok!==true)return outcome;
 if(save(game))return outcome;
 for(const key of Object.keys(game))delete game[key];Object.assign(game,snapshot);
 return {ok:false,reason:'save-failed',message:'本地保存失败，操作未提交。请检查存储空间后重试'};
}
