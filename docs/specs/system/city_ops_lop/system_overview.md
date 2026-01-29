# System Overview

This system is designed for sustainability-related use cases operating in underground spaces within a limited network environment.

The system provides the following capabilities:

## Worker Features
- Provides functionality to support field operations using collection kanbans and similar tools.

## Operations Features
- Provides dashboard functionality to gain insights into site conditions and operational status.

The system is designed to operate on a closed-domain network. External cloud usage is minimized, and Agora is used for system health monitoring (health checks).

# System diagrams
## System context
```mermaid

    C4Context
      title System Context diagram for LOP system
      Person(Worker, "LOP Worker", "Performs delivery<br/>and collection tasks")
    

    Enterprise_Boundary(b0, "On-Premise Network") {
      System(Monitor, "Signboard", "Work instructions")
      System(Smartdevice, "Check Device", "Task management")
      System(IoT_System, "IoT System", "Data aggregation")
      System(IoT_H/W, "IoT Hardware", "Sensors & devices")
    }

    Enterprise_Boundary(b1, "Cloud Network") {
      System(Dashboard, "KPI Dashboard", "Operations view")
    }

    Enterprise_Boundary(b2, "Wbyt Network") {
        Person(Operator, "LOP Operator", "Plans operations")
    }

      Rel(Worker, Monitor, "Gets tasks")
      Rel(Worker, Smartdevice, "Updates status")
      Rel(Operator, Dashboard, "Monitors KPIs")
      Rel(Monitor, IoT_System, "Fetches task data")
      Rel(Smartdevice, IoT_System, "Sends updates")
      Rel(Dashboard, IoT_System, "Queries status")
      Rel(IoT_H/W, IoT_System, "Reports data")

      UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

# Notes
