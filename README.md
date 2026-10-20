# CPU Scheduling Algorithm Simulator

A web-based simulator that demonstrates and visualizes CPU scheduling algorithms used in operating systems.

**Live Demo:** [opers-logan.surge.sh](https://opers-logan.surge.sh/)

## About the Project

CPU scheduling is an essential concept in operating systems that determines how processes are allocated CPU execution time. This project provides an interactive web interface for exploring different scheduling algorithms and understanding their behavior.

The simulator helps students learn the fundamentals of CPU scheduling and compare different approaches to process execution.

## Features

- Interactive CPU scheduling simulation
- Support for multiple scheduling algorithms
- Process scheduling visualization
- Browser-based user interface
- Demonstrations of process execution and scheduling behavior

## Scheduling Algorithms

### 1. First Come, First Served (FCFS)

Schedules processes in the order of their arrival in the ready queue. It is a simple, non-preemptive scheduling algorithm.

### 2. Shortest Job First (SJF)

Selects the process with the shortest CPU burst time. The standard non-preemptive version runs the selected process until completion.

### 3. Priority Scheduling

Schedules processes based on their assigned priority. The execution order depends on the priority values and the scheduling rules used.

### 4. Round Robin (RR)

Assigns each process a fixed time quantum and cycles through the ready queue, providing CPU time to each eligible process.

## Technologies Used

- HTML
- CSS
- JavaScript

## Getting Started

### Prerequisites

- A modern web browser
- Git
- Visual Studio Code or another code editor (optional)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/LoganathRK/cpu-scheduling-simulator.git
   ```

2. Navigate to the project directory:

   ```bash
   cd cpu-scheduling-simulator
   ```

3. Open the project folder in Visual Studio Code.

4. Run the application using the appropriate method for your project. If it is a plain HTML/CSS/JavaScript application, open `index.html` in a browser or use the VS Code Live Server extension.

## Live Demo

Try the deployed application:

**[Open CPU Scheduling Algorithm Simulator](https://opers-logan.surge.sh/)**

## Learning Objectives

- Understand fundamental CPU scheduling concepts.
- Explore the behavior of different scheduling algorithms.
- Learn how process scheduling affects CPU utilization and execution order.
- Strengthen practical knowledge of operating systems.

## Future Enhancements

- Add more CPU scheduling algorithms.
- Improve scheduling visualizations and animations.
- Display scheduling metrics such as waiting time, turnaround time, and response time.
- Enhance interface responsiveness and usability.

## Author

**Loganath R K**

- GitHub: [@LoganathRK](https://github.com/LoganathRK)

## License

This project is intended for educational purposes. No specific open-source license has been assigned yet.

