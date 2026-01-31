//
//  AstroDashboardApp.swift
//  AstroDashboard
//
//  Created by 坂井正徳 on 2026-01-20.
//

import SwiftUI
import CoreData

@main
struct AstroDashboardApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
