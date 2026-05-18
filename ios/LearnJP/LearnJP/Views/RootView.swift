import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            ConfigView()
                .tabItem {
                    Label("Cấu hình", systemImage: "gearshape")
                }

            PracticeView()
                .tabItem {
                    Label("Luyện tập", systemImage: "character.book.closed")
                }
        }
    }
}
