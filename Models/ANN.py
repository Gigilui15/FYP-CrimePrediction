import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle

# Set seed for reproducibility
seed = 42
tf.random.set_seed(seed)
np.random.seed(seed)

# Load the dataset
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set.csv')

# Extract features and target variable
X = train_data.drop(columns=['total_crimes'])
y = train_data['total_crimes']

# Split the data into training and validation sets
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=seed)

# Standardize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)

# Define the neural network architecture
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(X_train_scaled.shape[1],)),
    tf.keras.layers.Dropout(0.1),  # Dropout layer with a dropout rate of 20%
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.1),  # Dropout layer with a dropout rate of 20%
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.1),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.1),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.0),# Dropout layer with a dropout rate of 20%
    tf.keras.layers.Dense(1)
])

# Compile the model
model.compile(optimizer='adam', loss='mean_squared_error')

# Train the model
model.fit(X_train_scaled, y_train, epochs=726, batch_size=32, validation_data=(X_val_scaled, y_val))

# Evaluate the model
val_loss = model.evaluate(X_val_scaled, y_val)
print("Validation Loss:", val_loss)

# Save the weights to a pickle file
model.save_weights('model_weights.pkl')

# Load the test dataset
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\test_set.csv')

# Extract features from test set
X_test = test_data.drop(columns=['total_crimes'])

# Standardize test features
X_test_scaled = scaler.transform(X_test)

# Predict total_crimes for test set
predictions = model.predict(X_test_scaled)

# Print the test dataset with predictions
test_data_with_predictions = test_data.copy()
test_data_with_predictions['predicted_total_crimes'] = predictions.flatten()
print(test_data_with_predictions)
