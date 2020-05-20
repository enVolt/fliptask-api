module.exports = {
    create: async(req,res,next) => {
        const {
            title
        } = req.body;
        try{
            const owner = req.user._id
            const board = await Board.findOne({title,owner});
            
            if(!board){
                const newBoard = await Board.create({
                    title,
                    owner
                });
                return res.status(200).send({
                    error: false,
                    data: newBoard,
                    message: "OK"
                });
            }
            return res.status(409).send({
                error: false,
                data: null,
                message: `Board already exists with name ${board.title}`
            });
        }catch(e){
            Logger.error(`[ERROR] Error in creating board ${e}`);
            return res.status(400).send({
                error: true,
                data: null,
                message: "Something went wrong!"
            });
        }
    },
    get: async(req,res,next) => {
        const user = req.user;
        const {boardId} = req.params;
        try{
            const extras = req.query.extras;
            let findObj = {
                owner: user._id
            };
            let queryOptions = {};
            let funcName = "find";
            if(boardId){
                findObj._id = boardId
                funcName = "findOne";
            }
            
            if(funcName === "find"){
                queryOptions.sort = {
                    last_accessed_at: "desc"
                }
            }
            
            let populate = [];
            const requestItems = extras && extras.split(",") || [];
            if(requestItems.length > 0){
                populate = requestItems.reduce((acc,key,arr) => {
                    let obj = {};
                    if(requestItems.indexOf("tasks") > -1 && requestItems.indexOf("task_list") > -1 && key === "task_list"){
                        obj = {
                            path: "task_list",
                            populate: {
                                path: "tasks"
                            }
                        }
                    }else{
                        obj.path = key
                    }
                    acc.push(obj);
                    return acc;
                },[]);
            }
            // console.log("populate", populate);
            const boards = await Board[funcName](findObj,null,queryOptions).populate(populate);
            return res.status(200).send({
                error: false,
                data: boards,
                message: "OK"
            });
        }catch(e){
            console.log(e);
            Logger.error(`[ERROR] Error in getting board ${e}`);
            return res.status(500).send({
                error: true,
                data: null,
                message: "Something went wrong!"
            });
        }
    },
    updateListOrder: async(req,res,next) => {
        try{
            const {
                task_list_id,
                at_index
            } = req.body;
            const {boardId} = req.params;
            const board = await Board.findById(boardId);
            if(board){
                if(board.task_list.indexOf(task_list_id) > -1){
                    const filterList = board.task_list.filter(id => id != task_list_id);
                   
                    board.task_list = [
                        ...filterList.slice(0, at_index),
                        task_list_id.toString(),
                        ...filterList.slice(at_index)
                    ]
                    const updatedBoard = await board.save();
                    return res.status(200).send({
                        error: false,
                        data: updatedBoard,
                        message: "OK"
                    });
                }else{
                    return res.status(400).send({
                        error: true,
                        data: null,
                        message: "Invalid tasklist id"
                    });
                }
            }
            return res.status(400).send({
                error: true,
                data: null,
                message: "Invalid board id"
            });
        }catch(e){
            Logger.error(`[ERROR] Error in updating list order ${e}`);
            return res.status(500).send({
                error: true,
                data: null,
                message: "Something went wrong!"
            });
        }
    }
}