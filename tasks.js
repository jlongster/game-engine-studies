

task.spawn(function myTask() {
    console.log('hi');
    yield task.sleep(2000);
    task.spawn(myTask);
});