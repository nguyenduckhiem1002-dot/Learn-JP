import Foundation

final class SessionStore: ObservableObject {
    @Published var baseURLString: String = "http://localhost:3000"
    @Published var authToken: String = ""

    var baseURL: URL? {
        URL(string: baseURLString)
    }
}
