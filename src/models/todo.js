import DataTypes from 'sequelize'
export default (sequelize) => {
    const Todo = sequelize.define('todos', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        owner_id: {
            type: DataTypes.INTEGER,
        },
        task: {
            type: DataTypes.TEXT,
        },
        done: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    })
    return Todo
}
