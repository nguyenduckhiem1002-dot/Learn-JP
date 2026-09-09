import Foundation

@MainActor
final class PracticeViewModel: ObservableObject {
    @Published private(set) var cards: [Card] = []
    @Published private(set) var currentIndex = 0
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let client = APIClient()
    private var promptShownAt: Date?

    var currentCard: Card? {
        guard currentIndex < cards.count else { return nil }
        return cards[currentIndex]
    }

    func loadCards(baseURL: URL, token: String?) async {
        isLoading = true
        errorMessage = nil

        do {
            cards = try await client.fetchCards(baseURL: baseURL, token: token)
            currentIndex = 0
            promptShownAt = Date()
        } catch {
            errorMessage = "Không tải được thẻ học. Kiểm tra URL/API và đăng nhập."
        }

        isLoading = false
    }

    func submitAnswer(correct: Bool, baseURL: URL, token: String?) async {
        guard let card = currentCard else { return }
        let responseMs = Int((Date().timeIntervalSince(promptShownAt ?? Date())) * 1000)
        let payload = ProgressPayload(cardId: card.id, correct: correct, responseMs: max(responseMs, 0))

        do {
            try await client.submitProgress(baseURL: baseURL, token: token, payload: payload)
            currentIndex += 1
            promptShownAt = Date()
        } catch {
            errorMessage = "Không gửi được tiến độ học."
        }
    }
}
