// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract TodoList {
    struct Todo {
        uint id;
        string content;
        bool completed;
        address creator;
    }

    // Array to store todo items:
    Todo[] public todos;

    // Mapping to track number of todos per user:
    mapping(address => uint) public userTodoCount;

    // Events for tracking todo actions:
    event TodoCreated(uint id, string content, address creator);
    event TodoCompleted(uint id, bool completed);
    event TodoDeleted(uint id);
    event TodoUpdate(uint id, string newContent);

    // Modifier to check todo ownership:
    modifier onlyCreator(uint _id) {
        require(todos[_id].creator == msg.sender, "Only the creator can modify this todo");
        _; // function execution continues
    }

    // Create a new todo item:
    function createTodo(string memory _content) public {
        // checking whether the input content has some length:
        require(bytes(_content).length > 0, "Todo content cannot be empty!");

        uint id = todos.length;
        todos.push(Todo({
            id: id,
            content: _content, 
            completed: false,
            creator: msg.sender
        }));

        userTodoCount[msg.sender]++;

        emit TodoCreated(id, _content, msg.sender);
    }

    // Mark a todo as completed or not:
    function toggleCompleted(uint _id) public onlyCreator(_id) {
        todos[_id].completed = !todos[_id].completed;
        emit TodoCompleted(_id, todos[_id].completed);
    }
   
    // Update todo content:
    function updateTodo(uint _id, string memory _newContent) public onlyCreator(_id) {
        require(todos[_id].creator == msg.sender, "Only the creator can modify this todo");
        // checking whether the input content has some length:
        require(bytes(_newContent).length > 0, "Todo content cannot be empty!");

        todos[_id].content = _newContent;
        emit TodoUpdate(_id, _newContent);
    }
   
    // Delete a todo item:
    function deleteTodo(uint _id) public onlyCreator(_id) {
        // Replace the todo to delete with the last todo in the array
        todos[_id] = todos[todos.length - 1];

        // Update the id of the moved todo
        todos[_id].id = _id;

        // Remove the last item
        todos.pop();

        // Decrement the user todos by 1
        userTodoCount[msg.sender]--;

        emit TodoDeleted(_id);
    }
    
    // Get all todos:
    function getAllTodos() public view returns (Todo[] memory) {
        return todos;
    }

    // Get todos created by a specific user:
    function getUserTodos() public view returns (Todo[] memory) {
        Todo[] memory userTodos = new Todo[](userTodoCount[msg.sender]);
        uint counter = 0;

        for (uint i = 0; i<todos.length; i++) {
            userTodos[counter] = todos[i];
            counter++;
        }

        return userTodos;
    }

    // Get total number of todos
    function getTotalTodoCount() public view returns (uint) {
        return todos.length;
    }
}
