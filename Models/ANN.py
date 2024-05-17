import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns

# Set the aesthetics for the plots
sns.set(style="whitegrid")

# Load the dataset
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\train_set.csv')
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\Data\\test_set.csv')

# Extract features and target variable from the train set
X_train = train_data.drop(columns=['total_crimes'])
y_train = train_data['total_crimes']

# Extract features and the target variable from the test set
X_test = test_data.drop(columns=['total_crimes'])
y_test = test_data['total_crimes']

# Standardize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Define the neural network architecture
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(X_train_scaled.shape[1],)),
    tf.keras.layers.Dropout(0.0009128999960734544),
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.Dropout(0.0852517304915868),
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.Dropout(0.032226509979418574),
    tf.keras.layers.Dense(1)
])

# Compile the model
optimizer = tf.keras.optimizers.Adam(learning_rate=0.004003015327796763)
model.compile(optimizer=optimizer, loss='mean_squared_error')

# Early Stopping Callback
early_stopping = tf.keras.callbacks.EarlyStopping(
    monitor='val_loss',
    patience=50,  # Number of epochs with no improvement after which training will be stopped
    restore_best_weights=True  # Restores model weights from the epoch with the best value of the monitored quantity
)

# Fit the model on the training data
history = model.fit(
    X_train_scaled, 
    y_train, 
    epochs=10000, 
    batch_size=32, 
    validation_split=0.2, 
    callbacks=[early_stopping],  # Add the early stopping callback here
    verbose=1
)

# Predict total crimes for the test set
predictions = model.predict(X_test_scaled)

# Add predictions to the test dataset for visualization
test_data_with_predictions = test_data.copy()
test_data_with_predictions['ann_predictions'] = predictions.flatten()

# Calculate metrics
mse = mean_squared_error(y_test, predictions)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

# Plotting training and validation loss
plt.figure(figsize=(10, 5))
plt.plot(history.history['loss'], color='blue', label='Training Loss')
plt.plot(history.history['val_loss'], color='green', label='Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.title('Training and Validation Loss')
plt.legend()
plt.show()

# True vs. Predicted Values Scatterplot
plt.figure(figsize=(8, 8))
sns.scatterplot(x=y_test, y=predictions.flatten(), color='blue')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', label='Perfect Prediction Line')
plt.xlabel('True Values')
plt.ylabel('Predicted Values')
plt.title('Actual vs. Predicted Values')
plt.legend()
plt.show()

# Residuals Plot
residuals = y_test - predictions.flatten()
plt.figure(figsize=(8, 6))
sns.scatterplot(x=y_test, y=residuals, color='blue')
plt.axhline(y=0, color='red', linestyle='--')
plt.xlabel('True Values')
plt.ylabel('Residuals')
plt.title('Residuals Plot')
plt.show()

# Output predictions alongside the test data
print(test_data_with_predictions[['total_crimes', 'ann_predictions']])

print(f"Mean Squared Error (MSE): {mse}")
print(f"Root Mean Squared Error (RMSE): {rmse}")
print(f"Mean Absolute Error (MAE): {mae}")
print(f"R-squared (R2): {r2}")
