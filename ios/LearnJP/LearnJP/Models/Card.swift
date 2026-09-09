import Foundation

struct Card: Decodable, Identifiable {
    let id: String
    let prompt: String
    let answer: String
    let reading: String?
    let deck: String?
    let dueAt: Date?
}
