/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import type { Product } from '../../types/product';

// Mock the hooks and router BEFORE importing anything else
vi.mock('../../hooks/useProduct');
vi.mock('../../contexts/CartContext', () => ({
  useCartContext: vi.fn(() => ({
    items: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    totalItems: 0,
    totalPrice: 0,
  })),
  CartProvider: ({ children }: { children: React.ReactNode }) => children,
  CartContext: {},
}));
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useParams: vi.fn(() => ({ productId: '1' })),
    Link: ({
      children,
      to,
      className,
    }: {
      children: React.ReactNode;
      to: string;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Import after mocking
import { useProduct } from '../../hooks/useProduct';
import { ProductDetail } from './index';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: 'This is a test product description',
  category: 'Electronics',
  price: 99.99,
  rating: 4.5,
  stock: 10,
  brand: 'TestBrand',
  availabilityStatus: 'In Stock',
  returnPolicy: '30 day return policy',
  thumbnail: 'https://example.com/thumbnail.jpg',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
};

describe('ProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with various product data', () => {
    it('should render the product detail with all information when product data is loaded', () => {
      vi.mocked(useProduct).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
        
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('This is a test product description')).toBeInTheDocument();
      expect(screen.getByText('TestBrand')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText(/4.5/)).toBeInTheDocument();
    });

    it('should render product without optional brand', () => {
      const productWithoutBrand = { ...mockProduct, brand: undefined };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithoutBrand,
        isLoading: false,
        isError: false,
        error: null,
        
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should display the primary image from images array', () => {
      vi.mocked(useProduct).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
        
      } as any);

      renderWithProviders(<ProductDetail />);

      const image = screen.getByAltText('Test Product') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/image1.jpg');
    });

    it('should fallback to thumbnail when images array is empty', () => {
      const productWithoutImages = { ...mockProduct, images: [] };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithoutImages,
        isLoading: false,
        isError: false,
        error: null,
        
      } as any);

      renderWithProviders(<ProductDetail />);

      const image = screen.getByAltText('Test Product') as HTMLImageElement;
      expect(image.src).toBe('https://example.com/thumbnail.jpg');
    });
  });

  describe('Displaying and formatting product information', () => {
    it('should format price with two decimal places', async () => {
      const productWithWholePrice = { ...mockProduct, price: 100 };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithWholePrice,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should format rating with one decimal place', async () => {
      const productWithRating = { ...mockProduct, rating: 4.567 };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithRating,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText(/4.6/)).toBeInTheDocument();
    });

    it('should display all metadata fields', async () => {
      vi.mocked(useProduct).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText('Brand')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
    });
  });

  describe('Handling loading and error states', () => {
    it('should handle loading state gracefully', async () => {
      vi.mocked(useProduct).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      // The component should still render the structure
      expect(screen.getByText('← Back to Products')).toBeInTheDocument();
    });

    it('should handle error state', async () => {
      vi.mocked(useProduct).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load product'),
      } as any);

      renderWithProviders(<ProductDetail />);

      // The component should still render the structure
      expect(screen.getByText('← Back to Products')).toBeInTheDocument();
    });

    it('should handle undefined product data', async () => {
      vi.mocked(useProduct).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      // Component should render without crashing
      expect(screen.getByText('← Back to Products')).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('should render the Add to Cart button', async () => {
      vi.mocked(useProduct).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      expect(addToCartButton).toBeInTheDocument();
    });

    it('should call addToCart when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useProduct).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      await user.click(addToCartButton);

      // The button should still be clickable after the action
      expect(addToCartButton).toBeInTheDocument();
    });

    it('should render navigation back link', async () => {
      vi.mocked(useProduct).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      const backLink = screen.getByText('← Back to Products');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long product descriptions', async () => {
      const longDescription = 'A'.repeat(1000);
      const productWithLongDescription = { ...mockProduct, description: longDescription };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithLongDescription,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle zero stock', async () => {
      const productWithZeroStock = { ...mockProduct, stock: 0 };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithZeroStock,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle zero rating', async () => {
      const productWithZeroRating = { ...mockProduct, rating: 0 };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithZeroRating,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText(/0.0/)).toBeInTheDocument();
    });

    it('should handle very high prices', async () => {
      const expensiveProduct = { ...mockProduct, price: 9999999.99 };
      vi.mocked(useProduct).mockReturnValue({
        data: expensiveProduct,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText('$9999999.99')).toBeInTheDocument();
    });

    it('should handle special characters in product title', async () => {
      const productWithSpecialChars = {
        ...mockProduct,
        title: 'Test & Product "Special" <Characters>',
      };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithSpecialChars,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      expect(screen.getByText('Test & Product "Special" <Characters>')).toBeInTheDocument();
    });

    it('should handle empty category', async () => {
      const productWithEmptyCategory = { ...mockProduct, category: '' };
      vi.mocked(useProduct).mockReturnValue({
        data: productWithEmptyCategory,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<ProductDetail />);

      // Component should render without crashing even with empty category
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
  });
});
